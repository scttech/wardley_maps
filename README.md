# Wardley Maps

An interactive Wardley map editor and tutorial built with plain HTML5, ES modules and d3.js.
There is no build step and no Node dependency: d3 and QUnit are vendored in `vendor/`.

The Wardley Maps are built using a syntax similar to [PlantUML](https://plantuml.com/)

## Run locally

ES modules are blocked on `file://`, so serve the folder with any static server, e.g.

    python -m http.server 8000

then open <http://localhost:8000/> (app) or <http://localhost:8000/tests/> (unit tests).
The VS Code "Live Server" extension works too.

## Live Demo

Check out the live demo here