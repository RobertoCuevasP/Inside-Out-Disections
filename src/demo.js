import { buildTriangleDissection } from "./geometry.js";

const A = { x : 0, y : 0 };
const B = { x : 10, y : 0 };
const V = { x : 3, y : 7 };
const alpha = Math.atan2(7, 24);

const { vertices, before, after} = buildTriangleDissection(A, B, V, alpha);


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
        polygon.setAttribute("stroke", "#334155");
        polygon.setAttribute("stroke-width", "0.03");

        svg.append(polygon);
    });

    pieces.forEach((piece) => {
        if (!piece.originalEdge) return;

        const [i, j] = piece.originalEdge;
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

        svg.append(line);
    });
}


const steps = {
    original: {
        pieces: [{ vertices, originalEdge: null }],
        description: "Original triangle, before cutting."
    },
    cuts: {
        pieces: before,
        description: "Seven pieces. Discontinuous trace marks original limits."
    },
    after: {
        pieces: after,
        description: "Pieces has been exchanged. Marked traces now are in the interior."
    }
};

const buttons = document.querySelectorAll("button[data-step]");
const description = document.querySelector("#step-description");

function showStep(name) {
    const step = steps[name];

    drawPieces(step.pieces);
    description.textContent = step.description;
    svg.setAttribute("aria-label", step.description);

    buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.step === name));
    });
}

buttons.forEach((button) => {
    button.addEventListener("click", () => showStep(button.dataset.step));
});

showStep("original");