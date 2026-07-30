// chip-rulebook.js

import { GameData } from "./game-data.js";

const chips = await GameData.load("chips");

const output = document.querySelector("#rulebook");

output.innerHTML = "";

for (const chip of chips) {

    output.innerHTML += `

<section class="rule-entry">

<h2 id="${chip.id}">
${chip.name}
</h2>

<div class="meta">

<span>${chip.rarity}</span>

<span>${chip.type}</span>

</div>

<p>

${chip.description}

</p>

</section>

`;
}