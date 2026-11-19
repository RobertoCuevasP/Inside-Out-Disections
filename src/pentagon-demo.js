import { buildRegularPentagonDissection } from "./geometry.js";
import { drawPieces } from "./render.js";

export function initPentagonDemo() {
    const svg = document.querySelector("#pentagon-drawing");
    const cuts = document.querySelector("#pentagon-cuts");
    const afterButton = document.querySelector("#pentagon-after");
    const status = document.querySelector("#pentagon-status");
    const { before, after } = buildRegularPentagonDissection();

    function show(reconstructed) {
        drawPieces(reconstructed ? after : before, svg);
        cuts.setAttribute("aria-pressed", String(!reconstructed));
        afterButton.setAttribute("aria-pressed", String(reconstructed));
        status.textContent = reconstructed
            ? "The marked segments now meet the central piece."
            : "The marked segments cover the original outline.";
    }

    cuts.addEventListener("click", () => show(false));
    afterButton.addEventListener("click", () => show(true));
    show(false);
}
