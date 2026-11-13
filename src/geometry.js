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