import {
    findValidPolygonDissection,
    verifyReconstruction,
    buildHexagonRhombiDissection,
    buildRegularTwoEdgeDissection,
    buildRegularGroupedDissection
} from "./geometry.js";
import { drawPieces, getOriginalEdges } from "./render.js";

export function initRegularDemo() {
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
        const grouping = regularResult.groups ? ` Boundary groups: ${regularResult.groups.join(" + ")}.` : "";

        regularStatus.textContent = `${label}: ${before.length} pieces.${grouping} ${message}`;
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

            let result;
            if (method === "general") {
                result = findValidPolygonDissection(vertices);
            } else if (n === 6) {
                result = buildHexagonRhombiDissection(vertices, polygonCenter);
            } else if (n <= 9) {
                result = buildRegularTwoEdgeDissection(vertices);
            } else {
                result = buildRegularGroupedDissection(vertices);
            }

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
}
