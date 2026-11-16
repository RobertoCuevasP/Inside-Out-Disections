import { 
    buildPolygonDissection, 
    findOverlappingTriangles,
    findTriangleOutsidePolygon, 
    isSimpleBoundary, 
    findValidPolygonDissection, 
    polygonArea,
    verifyReconstruction
} from "./geometry.js";

const triangle = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 3, y: 7}
];

const rectangle = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 2 },
    { x: 0, y: 2 }
];

const pentagon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 4 },
    { x: 8, y: 6 },
    { x: 0, y: 6 }
];

const narrowRectangle = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 2 },
    { x: 0, y: 2 }
];

const notchedPolygon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 6 },
    { x: 3, y: 6 },
    { x: 3, y: 0.5 },
    { x: 2, y: 0.5 },
    { x: 2, y: 6 },
    { x: 0, y: 6 },
];

const alpha = Math.atan2(7, 24);

/*const results = [alpha, alpha / 2].map((angle) => {
    const { before } = buildPolygonDissection(narrowRectangle, angle);
    const pair = findOverlappingTriangles(before);
    const degrees = (angle * 180 / Math.PI).toFixed(2);

    return pair === null ? `${degrees} degrees: no triangle overlap detected` : `${degrees} degrees: pieces ${pair[0] + 1} and ${pair[1] + 1} overlap`;
});*/

const results = [alpha, alpha / 2].map((angle) => {
    const { before } = buildPolygonDissection(notchedPolygon, angle);
    const invalid = findTriangleOutsidePolygon(before, notchedPolygon);
    const degrees = (angle * 180 / Math.PI).toFixed(2);

    return invalid === null
        ? `${degrees} degrees: all triangular pieces pass containment`
        : `${degrees} degrees: piece ${invalid + 1} fails containment`;
});

/*const output = document.createElement("pre");
output.textContent = results.join("\n");
document.body.append(output);*/

const { vertices, before, after } = buildPolygonDissection(pentagon, alpha);

const central = before[before.length -1];

const crossedBoundary = [
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
    { x: 4, y: 0 },
];

/*const boundaryOutput = document.createElement("pre");
boundaryOutput.textContent = `Central boundary is simple ${isSimpleBoundary(central.vertices)}\n` + `Crossed boundary is simple: ${isSimpleBoundary(crossedBoundary)}`;
document.body.append(boundaryOutput);*/

const colors = [
    "#60a5fa", "#93c5fd",
    "#fb923c", "#fdba74",
    "#4ade80", "#86efac",
    "#c084fc", "#d8b4fe",
    "#f472b6", "#f9a8d4",
    "#e2e8f0"
];

const svg = document.querySelector("#drawing");
const svgNamespace = "http://www.w3.org/2000/svg";


function drawPieces(pieces) {
    svg.replaceChildren();

    pieces.forEach((piece, index) => {
        const polygon = document.createElementNS(svgNamespace, "polygon");

        const points = piece.vertices.map(({ x, y }) => `${x}, ${-y}`).join(" ");

        polygon.setAttribute("points", points);
        const fill = piece.originalEdge ? colors[index % (colors.length -1)] : "#e2e8f0";       
        polygon.setAttribute("fill", fill);
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

/*const angleOutput = document.createElement("pre");

try {
    const result = findValidPolygonDissection(narrowRectangle);

    const lines = result.attempts.map(({ alpha, reason }) => {
        const degrees = (alpha * 180 / Math.PI).toFixed(2);
        return `${degrees} degrees: ${reason ?? "accepted"}`;
    });

    lines.push(`Pieces: ${result.before.length}`);
    
    const originalArea = polygonArea(result.vertices);
    const totalArea = (pieces) => pieces.reduce(
        (sum, piece) => sum + polygonArea(piece.vertices), 0
    );

    lines.push(`Original area: ${originalArea.toFixed(6)}`);
    lines.push(`Pieces before: ${totalArea(result.before).toFixed(6)}`);
    lines.push(`Pieces after: ${totalArea(result.after).toFixed(6)}`);
    
    lines.push(`Reconstruction matches: ${verifyReconstruction(result)}`);
    const wrongAfter = [...result.after];
    wrongAfter[0] = result.before[0];
    lines.push(`Incorrect reconstruction matches: ${verifyReconstruction({ ...result, after: wrongAfter})}`);

    angleOutput.textContent = lines.join("\n");
} catch (error) {
    angleOutput.textContent = `Dissection text: ${error.message}`;
}

document.body.append(angleOutput);
*/

const startButton = document.querySelector("#start-polygon");
const undoButton = document.querySelector("#undo-vertex");
const closeButton = document.querySelector("#close-polygon");
const editorStatus = document.querySelector("#editor-status");

let drawing = false;
const draft = [];

svg.style.pointerEvents = "all";

function drawDraft() {
    svg.replaceChildren();

    const path = document.createElementNS(svgNamespace, "polyline");
    path.setAttribute("points", draft.map(({ x, y}) => `${x},${-y}`).join(" "));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#334155");
    path.setAttribute("stroke-width", "0.04");
    svg.append(path);

    draft.forEach(({ x, y}) => {
        const dot = document.createElementNS(svgNamespace, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", -y);
        dot.setAttribute("r", "0.08");
        dot.setAttribute("fill", "#334155");
        svg.append(dot);
    });

    undoButton.disabled = draft.length === 0;
    closeButton.disabled = draft.length < 3;
    editorStatus.textContent = `${draft.length} vertices. Tap the canvas to add one`;
}

startButton.addEventListener("click", () => {
    drawing = true;
    draft.length = 0;
    buttons.forEach(button => { button.disabled = true; });
    description.textContent = "Draw a polygon by marking its vertices in order";
    svg.setAttribute("aria-label", "Polygon drawing canvas");
    drawDraft();
});

svg.addEventListener("click", (event) => {
    if (!drawing) return;

    const transform = svg.getScreenCTM();
    if (!transform) return;

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(transform.inverse());
    const view = svg.viewBox.baseVal;
    if (point.x < view.x || point.x > view.x + view.width || point.y < view.y || point.y > view.y + view.height) return;

    draft.push({ x: point.x, y: -point.y });
    drawDraft();
});

undoButton.addEventListener("click", () => {
    draft.pop();
    drawDraft();
});

closeButton.addEventListener("click", () => {
    try {
        const result = findValidPolygonDissection(draft);
        if (!verifyReconstruction(result)) {
            throw new Error("The pieces do not match their target positions.");
        }

        steps.original.pieces = [{ vertices: result.vertices, originalEdge: null }];
        steps.original.description = "Original polygon, before cutting";
        steps.cuts.pieces = result.before;
        steps.cuts.description = `${result.before.length} pieces. Dashed lines mark the original boundary`;
        steps.after.pieces = result.after;
        steps.after.description = "The pieces have been exchanged. Dashed segments now lie along internal cuts";

        drawing = false;
        undoButton.disabled = true;
        closeButton.disabled = true;
        buttons.forEach(button => { button.disabled = false;});
        showStep("original");

        const degrees = (result.alpha * 180 / Math.PI).toFixed(2);
        editorStatus.textContent = `Accepted cut angle: ${degrees} degrees`;
    } catch (error) {
        editorStatus.textContent = `${error.message}. Undo a vertex or start again`;
    }
});