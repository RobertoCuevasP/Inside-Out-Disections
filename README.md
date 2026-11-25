# Inside-Out Dissections

Static HTML, CSS, SVG and JavaScript. No dependencies are needed to serve the site.

## Run the site

From this directory, run `python3 -m http.server 8000` and open http://localhost:8000/.
Serve the project over HTTP so the browser can load its JavaScript modules.

## Source layout

- `src/geometry.js`: geometric constructions and checks.
- `src/render.js`: shared SVG piece renderer and original-boundary markings.
- `src/intro-demo.js`, `src/general-demo.js`, `src/regular-demo.js`: independent interface state for the three demos.
- `src/demo.js`: initialises the demos.

The References section attributes the constructions. The four-piece triangle and the triangulation illustration are drawn from coordinates.
