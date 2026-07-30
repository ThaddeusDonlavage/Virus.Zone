// experimental/scripts/game-data.js

export class GameData {
    static cache = {};

    static async load(name) {
        if (this.cache[name]) {
            return this.cache[name];
        }

        const response = await fetch(`/data/${name}.json`);

        if (!response.ok) {
            throw new Error(`Unable to load ${name}.json`);
        }

        this.cache[name] = await response.json();

        return this.cache[name];
    }

    static async chip(id) {
        const chips = await this.load("chips");
        return chips.find(c => c.id === id);
    }

    static async equipment(id) {
        const items = await this.load("equipment");
        return items.find(i => i.id === id);
    }
}