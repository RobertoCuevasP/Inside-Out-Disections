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
        y: B.y + sin * dx + cos * dy
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