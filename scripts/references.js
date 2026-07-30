// experimental/scripts/references.js

import { GameData } from "./game-data.js";

const types = {
    chip: "chip",
    equipment: "equipment"
};

export async function renderReferences(element) {

    const regex = /\{\{(\w+):([\w-]+)\}\}/g;

    let html = element.innerHTML;

    const matches = [...html.matchAll(regex)];

    for (const match of matches) {

        const [original, type, id] = match;

        const object = await GameData[types[type]](id);

        if (!object) {
            continue;
        }

        html = html.replace(
            original,
            `<a class="reference"
                href="/database/${type}.html#${id}"
                data-type="${type}"
                data-id="${id}">
                ${object.name}
            </a>`
        );
    }

    element.innerHTML = html;
}
