import { checkRegularChallenge } from "./geometry.js";
import { drawPieces, svgNamespace } from "./render.js";

export function initChallengeDemo() {
    const n = 10;
    const requiredMarks = 4;
    const vertices = Array.from({ length: n }, (_, i) => {
        const angle = Math.PI / 2 + i * 2 * Math.PI / n;
        return { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) };
    });

    const svg = document.querySelector("#challenge-drawing");
    const status = document.querySelector("#challenge-status");
    const check = document.querySelector("#challenge-check");
    const reconstruct = document.querySelector("#challenge-reconstruct");
    const reset = document.querySelector("#challenge-reset");

    const marks = new Set();
    let result = null;
    let reconstructed = false;

    function selectedGroups() {
        const indices = [...marks].sort((a, b) => a - b);
        return indices.map((start, i) => {
            const next = i + 1 < indices.length ? indices[i + 1] : indices[0] + n;
            return next - start;
        });
    }

    function toggle(index) {
        if (marks.has(index)) {
            marks.delete(index);
        } else if (marks.size < requiredMarks) {
            marks.add(index);
        } else {
            status.textContent = "Remove a mark before selecting another vertex.";
            return;
        }

        result = null;
        reconstructed = false;
        render(index);
    }

    function render(focusIndex = null, error = "") {
        const pieces = result
            ? (reconstructed ? result.after : result.before)
            : [{ vertices }];

        drawPieces(pieces, svg);

        vertices.forEach(({ x, y }, i) => {
            const dot = document.createElementNS(svgNamespace, "circle");
            dot.setAttribute("cx", x);
            dot.setAttribute("cy", -y);
            dot.setAttribute("r", "0.24");
            dot.setAttribute("class", "challenge-vertex");
            dot.setAttribute("tabindex", "0");
            dot.setAttribute("role", "button");
            dot.setAttribute("aria-label", `Vertex ${i + 1}`);
            dot.setAttribute("aria-pressed", String(marks.has(i)));

            dot.addEventListener("click", () => toggle(i));
            dot.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(i);
                }
            });

            svg.append(dot);
            if (i === focusIndex) dot.focus();
        });

        check.disabled = marks.size !== requiredMarks;
        reconstruct.disabled = !result || reconstructed;

        if (marks.size !== requiredMarks) {
            status.textContent = `${marks.size} of ${requiredMarks} vertices marked.`;
            return;
        }

        const prefix = `Groups: ${selectedGroups().join(" + ")}.`;
        const message = error || (reconstructed
            ? "The original boundary now lies along internal cuts."
            : result
                ? "Valid cuts: four exterior pieces and one central piece."
                : "Check whether these groups fit.");

        status.textContent = `${prefix} ${message}`;
    }

    check.addEventListener("click", () => {
        if (marks.size !== requiredMarks) return;

        const indices = [...marks].sort((a, b) => a - b);
        // Start the construction at the first marked vertex, not at vertex 0.
        const start = indices[0];
        const ordered = [...vertices.slice(start), ...vertices.slice(0, start)];

        try {
            result = checkRegularChallenge(ordered, selectedGroups());
            reconstructed = false;
            render();
        } catch (error) {
            result = null;
            render(null, error.message);
        }
    });

    reconstruct.addEventListener("click", () => {
        if (!result) return;
        reconstructed = true;
        render();
    });

    reset.addEventListener("click", () => {
        marks.clear();
        result = null;
        reconstructed = false;
        render();
    });

    render();
}