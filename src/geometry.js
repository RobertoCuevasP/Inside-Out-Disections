export function buildEdgePair(A, B, alpha) {
    // We define a vector d which will be in the middle of A and B
    const dx = (B.x - A.x) / 2;
    const dy = (B.y - A.y) / 2;

    const M = {
        x: A.x + dx,
        y: A.y + dy
    };

    const cos = Math.cos(alpha);
    const sin = Math.sin(alpha);

    // We turn AM size with an angle alpha on A
    const C = {
        x: A.x + cos * dx - sin * dy,
        y: A.y + sin * dx + cos * dy
    };

    const D = {
        x: B.x - cos * dx - sin * dy,
        y: B.y - cos * dy + sin * dx
    };

    return {
        M, 
        C,
        D,
        pieces: [
            { vertices: [A, M, C], originalEdge: [0, 1] },
            { vertices: [B, M, D], originalEdge: [0, 1] }
        ]
    }
}

export function movePiece(piece, from, to, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const vertices = piece.vertices.map((point) => {
        // Original coordinates from original pivot
        const x = point.x - from.x;
        const y = point.y - from.y;

        // We turn the vector and place it respect to the new pivot
        return {
            x: to.x + cos * x - sin * y,
            y: to.y + sin * x + cos * y
        };
    });

    return { ...piece, vertices};
}

export function swapEdgePair(pair, A, B, alpha) {
    const [first, second] = pair.pieces;

    return [
        movePiece(first, A, B, Math.PI - alpha),
        movePiece(second, B, A, Math.PI + alpha)
    ];
}

export function buildTriangleDissection(A, B, V, alpha) {
    // Orientation calculus
    const cross = (B.x - A.x) * (V.y - A.y) - (B.y - A.y) * (V.x - A.x);

    if (cross === 0) {
        throw new Error("The given vertices does not form a triangle.");
    }

    // We will go in anticlock order
    const vertices = cross > 0 ? [A, B, V] : [A, V, B];

    const angles = vertices.map((point, i) => {
        const next = vertices[(i + 1) % 3];
        const previous = vertices[(i + 2) % 3];

        const ux = next.x - point.x;
        const uy = next.y - point.y;
        const vx = previous.x - point.x;
        const vy = previous.y - point.y;

        return Math.atan2(Math.abs(ux * vy - uy * vx), ux * vx + uy * vy);
    });

    if (!(alpha > 0 && 2 * alpha < Math.min(...angles))) {
        throw new Error("The angle cut does not leave margin in the corners.");
    }

    const before = [];
    const after = [];
    const centralVertices = [];

    for (let i = 0; i < 3; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % 3];
        const pair = buildEdgePair(start, end, alpha);

        before.push(...pair.pieces);
        after.push(...swapEdgePair(pair, start, end, alpha));

        centralVertices.push(start, pair.C, pair.M, pair.D);
    }

    const central = {
        vertices: centralVertices,
        originalEdge: null
    };

    before.push(central);
    after.push(central);

    return { vertices, before, after };
}

export function buildPolygonDissection(vertices, alpha) {
    const before = [];
    const after = [];
    const centralVertices = [];

    for (let i = 0; i < vertices.length; i++) {
        const start = vertices[i];
        const end = vertices[(i + 1) % vertices.length];

        const pair = buildEdgePair(start, end, alpha);
        before.push(...pair.pieces);
        after.push(...swapEdgePair(pair, start, end, alpha));

        centralVertices.push(start, pair.C, pair.M, pair.D);
    }

    const central = {
        vertices: centralVertices,
        originalEdge: null
    };

    return { vertices, before, after };
}

function trianglesOverlap(a, b, epsilon = 1e-9){
    for (const triangle of [a, b]) {
        for (let i = 0; i < triangle.length; i++) {
            const start = triangle[i];
            const end = triangle[(i + 1) % triangle.length];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.hypot(dx, dy);

            if (length === 0) continue;

            const nx = -dy / length;
            const ny = dx / length;
            const project = ({ x, y }) => x * nx + y * ny;

            const pa = a.map(project);
            const pb = b.map(project);
            const overlap = Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb));

            if (overlap <= epsilon) return false;
        }
    }

    return true;
}

export function findOverlappingTriangles(pieces){
    const triangles = pieces.slice(0, -1);

    for (let i = 0; i < triangles.length; i++) {
        for (let j = i + 1; j < triangles.length; j++) {
            if (trianglesOverlap(triangles[i].vertices, triangles[j].vertices)) {
                return [i, j];
            }
        }
    }

    return null;
}

function cutCross(a, b, p) {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function cutPointOnSegment(p, a, b, eps) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);

    return Math.abs(cutCross(a, b, p)) <= eps * length 
        && p.x >= Math.min(a.x, b.x) - eps
        && p.x <= Math.max(a.x, b.x) + eps
        && p.y >= Math.min(a.y, b.y) - eps
        && p.y <= Math.max(a.y, b.y) + eps;
}

function cutPointStrictlyInside(point, polygon, eps) {
    let inside = false;

    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];

        if (cutPointOnSegment(point, a, b, eps)) return false;

        if ((a.y > point.y) !== (b.y > point.y)) {
            const crossingX = a.x + (point.y - a.y) * (b.x - a.x) / (b.y - a.y);

            if (crossingX > point.x) inside = !inside;
        }
    }

    return inside;
}

function cutTouchesBoundaryAgain(start, tip, polygon, eps) {
    const oppositeSigns = (a, b) => (a < 0 && b > 0) || (a > 0 && b < 0);

    for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i];
        const b = polygon[(i + 1) % polygon.length];

        const crosses = oppositeSigns(cutCross(start, tip, a), cutCross(start, tip, b)) && oppositeSigns(cutCross(a, b, start), cutCross(a, b, tip));

        if (crosses) return true;

        for (const vertex of [a, b]){
            const isStart = Math.hypot(vertex.x - start.x, vertex.y - start.y) <= eps;

            if (!isStart && cutPointOnSegment(vertex, start, tip, eps)) {
                return true;
            }
        }        
    }

    return false;
}

export function findTriangleOutsidePolygon(pieces, polygon, eps = 1e-9) {
    for (let i = 0; i < pieces.length - 1; i++) {
        const [start, midpoint, tip] = pieces[i].vertices;

        if (!cutPointStrictlyInside(tip, polygon, eps)
            || cutTouchesBoundaryAgain(start, tip, polygon, eps)
            || cutTouchesBoundaryAgain(midpoint, tip, polygon, eps)) {
                return i;
            }
    }

    return null;
}

function segmentsTouchOrCross(a, b, c, d, eps) {
    const oppositeSigns = (x, y) => (x < 0 && y > 0) || (x > 0 && y < 0);

    const properCrossing = oppositeSigns(cutCross(a, b, c), cutCross(a, b, d)) && oppositeSigns(cutCross(c, d, a), cutCross(c, d, b));

    return properCrossing 
        || cutPointOnSegment(a, c, d, eps)
        || cutPointOnSegment(b, c, d, eps)
        || cutPointOnSegment(c, a, b, eps)
        || cutPointOnSegment(d, a, b, eps);
}

export function isSimpleBoundary(vertices, eps = 1e-9) {
    const n = vertices.length;
    if (n < 3) return false;

    for (let i = 0; i < n; i++) {
        const previous = vertices[(i + n - 1) % n];
        const a = vertices[i];
        const b = vertices[(i + 1) % n];
        
        if (Math.hypot(b.x - a.x, b.y - a.y) <= eps) return false;

        if (cutPointOnSegment(previous, a, b, eps) || cutPointOnSegment(b, previous, a, eps)) {
            return false;
        }

        for (let j = i + 1; j < n; j++) {
            if (j === i + 1 || (i === 0 && j === n -1)) continue;

            const c = vertices[j];
            const d = vertices[(j + 1) % n];

            if (segmentsTouchOrCross(a, b, c, d, eps)) return false;
        }
    }

    return true;
}