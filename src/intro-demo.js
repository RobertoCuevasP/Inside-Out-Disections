import { buildFourPieceTriangle } from "./geometry.js";
import { drawPieces } from "./render.js";

export function initTriangleIntro() {
    const svg = document.querySelector("#intro-drawing");
    const cuts = document.querySelector("#intro-cuts");
    const reconstruction = document.querySelector("#intro-reconstruction");
    const status = document.querySelector("#intro-status");
    const { before, after } = buildFourPieceTriangle(
        { x: -4, y: 0 }, { x: 4, y: 0 }, { x: -1, y: 3 }
    );

    function render(reconstructed) {
        drawPieces(reconstructed ? after : before, svg);
        cuts.setAttribute("aria-pressed", String(!reconstructed));
        reconstruction.setAttribute("aria-pressed", String(reconstructed));
        status.textContent = reconstructed
            ? "The triangles trade places and the parallelograms turn. The dashed segments now lie along internal cuts."
            : "Four pieces. The dashed lines mark the original boundary.";
    }

    cuts.addEventListener("click", () => render(false));
    reconstruction.addEventListener("click", () => render(true));
    render(false);
}
