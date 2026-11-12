import { buildTriangleDissection } from "./geometry.js";

const A = { x : 0, y : 0 };
const B = { x : 10, y : 0 };
const V = { x : 3, y : 7 };
const alpha = Math.atan2(7, 24);

const { after } = buildTriangleDissection(A, B, V, alpha);
const svg = document.querySelector("#drawing");
const svgNamespace = "http://www.w3.org/2000/svg";

const colors = [
    "#60a5fa", "#93c5fd",
    "#fb923c", "#fdba74",
    "#4ade80", "#86efac",
    "#e2e8f0"
];

function drawPieces(pieces) {
    svg.replaceChildren();

    pieces.forEach((piece, index) => {
        const polygon = document.createElementNS(svgNamespace, "polygon");

        const points = piece.vertices.map(({ x, y }) => `${x}, ${-y}`).join(" ");

        polygon.setAttribute("points", points);
        polygon.setAttribute("fill", colors[index]);
        polygon.setAttribute("strike", "#334155");
        polygon.setAttribute("stroke-width", "0.03");

        svg.append(polygon);
    });
}

drawPieces(after);