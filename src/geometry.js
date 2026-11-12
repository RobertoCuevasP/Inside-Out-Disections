export function buildEdgePair(A, B, alpha){
    // We define a vector d which will be in the middle of A and B
    const dx = (B.x - A.x) / 2;
    const dy = (B.y - A.y) / 2;

    const M = {
        x: A.x + dx,
        y: A.y + dy
    };

    const cos = Math.cos(alpha);
    const sin = Math.cos(alpha);

    // We turn AM size with an angle alpha on A
    const C = {
        x: A.x + cos * dx - sin * dy,
        y: B.x + sin * dx + cos * dy
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