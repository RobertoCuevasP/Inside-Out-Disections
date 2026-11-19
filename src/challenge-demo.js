import {
    buildRegularDissectionFromGroups,
    checkRegularChallenge,
    isSimpleBoundary
} from "./geometry.js";
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
    let feedback = "";
    let pinchMarks = new Set();
    let reconstructed = false;

    function selectedGroups() {
        const indices = [...marks].sort((a, b) => a - b);
        return indices.map((start, i) => {
            const next = i + 1 < indices.length ? indices[i + 1] : indices[0] + n;
            return next - start;
        });
    }

    function toggle(index, restoreFocus = false) {
        if (marks.has(index)) {
            marks.delete(index);
        } else if (marks.size < requiredMarks) {
            marks.add(index);
        } else {
            status.textContent = "Remove a mark before selecting another vertex.";
            return;
        }
        result = null;
        feedback = "";
        pinchMarks.clear();
        reconstructed = false;
        render(restoreFocus ? index : null);
    }

    function render(focusIndex = null) {
        const pieces = result
            ? (reconstructed ? result.after : result.before)
            : [{ vertices }];

        drawPieces(pieces, svg);

        // Draw the shared cut above the pieces and below the vertex markers.
        if (result && pinchMarks.size > 0) {
            const indices = [...marks].sort((a, b) => a - b);

            indices.forEach((index, groupIndex) => {
                if (!pinchMarks.has(index)) return;

                // The first vertex starts the group. The last vertex joins it along the inner cut that closes the exterior piece.
                const piece = result.before[groupIndex];
                const v = piece.vertices[0];
                const p = piece.vertices[piece.vertices.length - 1];

                const line = document.createElementNS(svgNamespace, "line");
                line.setAttribute("x1", v.x);
                line.setAttribute("y1", -v.y);
                line.setAttribute("x2", p.x);
                line.setAttribute("y2", -p.y);
                line.setAttribute("class", "challenge-shared-cut");
                line.setAttribute("aria-hidden", "true");
                svg.append(line);
            });
        }

        vertices.forEach(({ x, y }, i) => {
            const dot = document.createElementNS(svgNamespace, "circle");
            dot.setAttribute("cx", x);
            dot.setAttribute("cy", -y);
            dot.setAttribute("r", "0.24");
            dot.setAttribute("class", pinchMarks.has(i) ? "challenge-vertex challenge-vertex--pinch" : "challenge-vertex");
            dot.setAttribute("tabindex", "0");
            dot.setAttribute("role", "button");
            dot.setAttribute("aria-label", `Vertex ${i + 1}`);
            dot.setAttribute("aria-pressed", String(marks.has(i)));
            dot.addEventListener("pointerdown", event => {
                event.preventDefault();
            });
            dot.addEventListener("click", () => toggle(i));
            dot.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(i, true);
                }
            });

            svg.append(dot);
            if (i === focusIndex) dot.focus();
        });
            check.disabled = marks.size !== requiredMarks;
            reconstruct.disabled = !result || reconstructed;
            reconstruct.textContent = feedback && result ? "Preview rotations" : "Reconstruction";

        if (marks.size !== requiredMarks) {
            status.textContent = `${marks.size} of ${requiredMarks} vertices marked.`;
            return;
        }

        const prefix = `Groups: ${selectedGroups().join(" + ")}.`;
        const message = feedback ? `${reconstructed ? "Rotation preview only. " : ""}${feedback}` : reconstructed
            ? "The original boundary now lies along internal cuts." : result
                ? "Valid cuts: four exterior pieces and one central piece." : "Check whether these groups fit.";

        status.textContent = `${prefix} ${message}`;
    }

    check.addEventListener("click", () => {
        if (marks.size !== requiredMarks) return;

        const indices = [...marks].sort((a, b) => a - b);
        // Start the construction at the first marked vertex, not at vertex 0.
        const start = indices[0];
        const ordered = [...vertices.slice(start), ...vertices.slice(0, start)];

        const groups = selectedGroups();
        const maxSize = Math.floor((n + 2) / 4);

        result = null;
        feedback = "";
        pinchMarks.clear();
        reconstructed = false;

        try {
            result = checkRegularChallenge(ordered, groups);
        } catch (error) {
            feedback = error.message;

            // Only preview groups that satisfy the challenge's size rule.
            if (groups.every(size => size >= 2 && size <= maxSize)) {
                result = buildRegularDissectionFromGroups(ordered, groups);

                const centre = result.before[result.before.length - 1];
                if (!isSimpleBoundary(centre.vertices)) {
                    groups.forEach((size, i) => {
                    const previous = groups[(i + groups.length - 1) % groups.length];
                    if (previous === maxSize && size === maxSize) {
                        pinchMarks.add(indices[i]);
                    }
                    });

                    if (pinchMarks.size > 0) {
                        feedback = "The two outer pieces share the orange edge. Our centre outline traces that edge in both directions, so this version rejects the grouping. Try placing a shorter group between the longer ones.";
                    }
                }
            }
        }

        render();
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