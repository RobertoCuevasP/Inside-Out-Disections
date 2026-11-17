import { 
    buildPolygonDissection, 
    findValidPolygonDissection,
    verifyReconstruction,
    buildHexagonRhombiDissection,
    buildRegularTwoEdgeDissection
} from "./geometry.js";

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

const { vertices, before, after } = buildPolygonDissection(pentagon, alpha);

const central = before[before.length -1];

const crossedBoundary = [
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
    { x: 4, y: 0 },
];

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

function getOriginalEdges(piece) {
    return piece.originalEdges ?? (piece.originalEdge ? [piece.originalEdge] : []);
}

function drawPieces(pieces, target = svg) {
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


const steps = {
    original: {
        pieces: [{ vertices, originalEdge: null }],
        description: `${before.length} pieces. Dashed lines mark the original boundary`
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

const nextSwapButton = document.querySelector("#next-swap");
let swapsDone = 0;

function getSwapCount() {
    const pieces = steps.cuts.pieces;
    const n = steps.original.pieces[0].vertices.length;

    const isGeneralConstruction =
        pieces.length === 2 * n + 1 &&
        pieces.slice(0, -1).every(piece =>
            piece.vertices.length === 3 && piece.originalEdge
        );

    return isGeneralConstruction ? n : 0;
}

function showStep(name) {
    const step = steps[name];

    drawPieces(step.pieces);
    description.textContent = step.description;
    svg.setAttribute("aria-label", step.description);

    buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.step === name));
    });

    swapsDone = name === "after" ? getSwapCount() : 0;
    nextSwapButton.disabled = name !== "cuts" || getSwapCount() === 0;
}

buttons.forEach((button) => {
    button.addEventListener("click", () => showStep(button.dataset.step));
});

showStep("original");

nextSwapButton.addEventListener("click", () => {
    const total = getSwapCount();
    if (swapsDone >= total) return;

    swapsDone++;

    if (swapsDone === total) {
        showStep("after");
        description.textContent = `Step ${total} of ${total}: reconstruction complete. ${steps.after.description}`;
        svg.setAttribute("aria-label", description.textContent);
        return;
    }

    // Each completed step replaces two pieces with their final positions.
    const movedPieces = 2 * swapsDone;
    const visiblePieces = steps.cuts.pieces.map((piece, index) =>
        index < movedPieces ? steps.after.pieces[index] : piece
    );

    drawPieces(visiblePieces);

    description.textContent = `Step ${swapsDone} of ${total}: the pair on side ${swapsDone} has been exchanged`;
    svg.setAttribute("aria-label", description.textContent);
    buttons.forEach(button => {
        button.setAttribute("aria-pressed", "false");
    });
});

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

    if (draft.length >= 3) {
        const first = draft[0];
        const last = draft[draft.length - 1];
        const closingEdge = document.createElementNS(svgNamespace, "line");

        closingEdge.setAttribute("x1", last.x);
        closingEdge.setAttribute("y1", -last.y);
        closingEdge.setAttribute("x2", first.x);
        closingEdge.setAttribute("y2", -first.y);
        closingEdge.setAttribute("stroke", "#64748b");
        closingEdge.setAttribute("stroke-width", "0.04");
        closingEdge.setAttribute("stroke-dasharray", "0.12 0.08");

        svg.append(closingEdge);
    }

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
    nextSwapButton.disabled = true;
    
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

function initPentagonIntro() {
    const introSvg = document.querySelector("#intro-drawing");
    const cutsButton = document.querySelector("#intro-cuts");
    const reconstructionButton = document.querySelector("#intro-reconstruction");
    const status = document.querySelector("#intro-status");
    const pentagon = Array.from({ length: 5 }, (_, i) => {
        const angle = Math.PI / 2 + i * 2 * Math.PI / 5;
        return { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) };
    });

    const edgeColors = [ "#60a5fa", "#fb923c", "#4ade80", "#c084fc", "#f472b6" ];

    function addSvgElement(tag, attributes) {
        const element = document.createElementNS(svgNamespace, tag);
        for (const [name, value] of Object.entries(attributes)) {
            element.setAttribute(name, String(value));
        }
        introSvg.append(element);
    }

    try {
        const result = findValidPolygonDissection(pentagon);

        if (!verifyReconstruction(result)) {
            throw new Error("The reconstruction does not match the expected positions.");
        }

        function render(reconstructed) {
            const pieces = reconstructed ? result.after : result.before;
            introSvg.replaceChildren();

            pieces.forEach((piece, index) => {
                const hasOriginalEdges = getOriginalEdges(piece).length > 0;

                addSvgElement("polygon", { 
                    points: piece.vertices.map(({ x, y }) => `${x},${-y}`).join(" "),
                    fill: hasOriginalEdges ? edgeColors[Math.floor(index / 2)] : "#e2e8f0",
                    stroke: "#334155",
                    "stroke-width": 0.03
                });
            });

            for (const piece of pieces) {
                for (const [i, j] of getOriginalEdges(piece)) {
                    const a = piece.vertices[i];
                    const b = piece.vertices[j];

                    addSvgElement("line", {
                        x1: a.x, y1: -a.y,
                        x2: b.x, y2: -b.y,
                        stroke: "#7f1d1d",
                        "stroke-width": 0.06,
                        "stroke-dasharray": "0.14 0.10"
                    });
                }
            }

            cutsButton.setAttribute("aria-pressed", String(!reconstructed));
            reconstructionButton.setAttribute("aria-pressed", String(reconstructed));
            status.textContent = reconstructed ? "Same outline. The marked segments now lie along internal cuts." : `${pieces.length} pieces. The dashed lines mark the original boundary.`;
        }

        cutsButton.addEventListener("click", () => render(false));
        reconstructionButton.addEventListener("click", () => render(true));
        render(false);
    } catch (error) {
        status.textContent = `Pentagon example unavailable: ${error.message}`;
        cutsButton.disabled = true;
        reconstructionButton.disabled = true;
    }
}

initPentagonIntro();

const polygonCenter = { x: 5, y: 3.5 };
function makeRegularPolygon(n) {
    return Array.from({ length: n }, (_, i) => {
        const angle = i * 2 * Math.PI / n;
        return {
            x: polygonCenter.x + 3.5 * Math.cos(angle),
            y: polygonCenter.y + 3.5 * Math.sin(angle)
        };
    });
}

const regularSvg = document.querySelector("#regular-drawing");
const regularStatus = document.querySelector("#hexagon-example");
const generalHexButton = document.querySelector("#hexagon-general");
const rhombiHexButton = document.querySelector("#hexagon-rhombi");
const regularNext = document.querySelector("#regular-next");
const regularViewButtons = document.querySelectorAll("[data-regular-view]");
const regularSides = document.querySelector("#regular-sides");

let regularResult;
let regularMethod;
let regularView = "cuts";
let regularDone = 0;

function getRegularStepCount() {
    return regularMethod === "general" ? 
        regularResult.vertices.length : 
        regularResult.before.filter(piece => getOriginalEdges(piece).length > 0).length;
}

function renderRegular() {
    const { vertices, before, after } = regularResult;
    const groupSize = regularMethod === "general" ? 2 : 1;
    const total = getRegularStepCount();
    const label = regularMethod === "general" ? "General construction" : "Regular construction";

    let pieces;
    let message;

    if (regularView === "original") {
        pieces = [{ vertices, originalEdge: null }];
        message = `The original regular ${vertices.length}-gon`;
    } else if (regularView === "after") {
        pieces = after;
        message = "Same outline. The marked segments lie along internal cuts";
    } else {
        pieces = before.map((piece, index) =>
            index < regularDone * groupSize ? after[index] : piece
        );
        const action = regularMethod === "general" ? "one pair exchanges positions" : "one outer piece rotates by 180 degrees";
        message = regularDone === 0 ? `Dashed lines mark the original boundary. In each step, ${action}.` : `Step ${regularDone} of ${total}. Follow the dashed lines`;
    }

    drawPieces(pieces, regularSvg);
    regularStatus.textContent = `${label}: ${before.length} pieces. ${message}`;
    regularNext.disabled = regularView !== "cuts" || regularDone >= total;

    generalHexButton.setAttribute("aria-pressed", String(regularMethod === "general"));
    rhombiHexButton.setAttribute("aria-pressed", String(regularMethod === "rhombi"));

    regularViewButtons.forEach(button => {
        const active = button.dataset.regularView === regularView &&
            (regularView !== "cuts" || regularDone === 0);
        button.setAttribute("aria-pressed", String(active));
    });
}

function selectHexagonMethod(method) {
    try {
        const n = Number(regularSides.value);
        const vertices = makeRegularPolygon(n);

        const result = method === "general" ? 
            findValidPolygonDissection(vertices) : n === 6 ?
                buildHexagonRhombiDissection(vertices, polygonCenter) : buildRegularTwoEdgeDissection(vertices);


        if (method === "general" && !verifyReconstruction(result)) {
            throw new Error("The pieces do not match their target positions.");
        }

        regularResult = result;
        regularMethod = method;
        regularView = "cuts";
        regularDone = 0;
        renderRegular();
    } catch (error) {
        regularStatus.textContent = `Could not load this construction: ${error.message}`;
    }
}

generalHexButton.addEventListener("click", () => selectHexagonMethod("general"));
rhombiHexButton.addEventListener("click", () => selectHexagonMethod("rhombi"));

regularViewButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (!regularResult) return;
        regularView = button.dataset.regularView;
        regularDone = 0;
        renderRegular();
    });
});

regularNext.addEventListener("click", () => {
    if (!regularResult || regularView !== "cuts") return;
    const total = getRegularStepCount();
    regularDone++;
    if (regularDone >= total) regularView = "after";
    renderRegular();
});

regularSides.addEventListener("change", () => {
    selectHexagonMethod(regularMethod ?? "rhombi");
});

selectHexagonMethod("rhombi");