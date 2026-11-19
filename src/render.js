const colors = [
    "#60a5fa", "#93c5fd",
    "#fb923c", "#fdba74",
    "#4ade80", "#86efac",
    "#c084fc", "#d8b4fe",
    "#f472b6", "#f9a8d4",
    "#e2e8f0"
];

export const svgNamespace = "http://www.w3.org/2000/svg";

export function getOriginalEdges(piece) {
    return piece.originalEdges ?? (piece.originalEdge ? [piece.originalEdge] : []);
}

export function drawPieces(pieces, target) {
    target.replaceChildren();

    pieces.forEach((piece, index) => {
        const polygon = document.createElementNS(svgNamespace, "polygon");

        const points = piece.vertices.map(({ x, y }) => `${x}, ${-y}`).join(" ");

        polygon.setAttribute("points", points);
        const fill = getOriginalEdges(piece).length > 0 ? colors[index % (colors.length -1)] : "#e2e8f0";       
        polygon.setAttribute("fill", fill);
        polygon.setAttribute("stroke", "#334155");
        polygon.setAttribute("stroke-width", "0.03");

        target.append(polygon);
    });

    pieces.forEach((piece) => {
        for (const [i, j] of getOriginalEdges(piece)) {
            const start = piece.vertices[i];
            const end = piece.vertices[j];
            const line = document.createElementNS(svgNamespace, "line");
            line.setAttribute("x1", start.x);
            line.setAttribute("y1", -start.y);
            line.setAttribute("x2", end.x);
            line.setAttribute("y2", -end.y);
            line.setAttribute("stroke", "#7f1d1d");
            line.setAttribute("stroke-width", "0.08");
            line.setAttribute("stroke-dasharray", "0.18 0.12");
            target.append(line);
        }
    });
}


