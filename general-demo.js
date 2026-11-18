import { buildPolygonDissection, findValidPolygonDissection, verifyReconstruction } from "./geometry.js";
import { drawPieces, svgNamespace } from "./render.js";

export function initGeneralDemo() {
    const svg = document.querySelector("#drawing");
    const pentagon = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 4 },
        { x: 8, y: 6 },
        { x: 0, y: 6 }
    ];

    const alpha = Math.atan2(7, 24);

    const { vertices, before, after } = buildPolygonDissection(pentagon, alpha);

    const steps = {
        original: {
            pieces: [{ vertices, originalEdge: null }],
            description: "Example polygon before cutting."
        },
        cuts: {
            pieces: before,
            description: `${before.length} pieces. Dashed lines mark the original boundary.`
        },
        after: {
            pieces: after,
            description: "The pieces have been exchanged. Dashed segments now lie along internal cuts."
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

        drawPieces(step.pieces, svg);
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

        drawPieces(visiblePieces, svg);

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
}
