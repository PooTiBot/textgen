import opentype from "opentype.js";
import type { Font } from "opentype.js";

const fontCache = new Map<string, Promise<Font>>();

async function fetchFont(file: string) {
    const response = await fetch(file);

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${file}`);
    }

    return opentype.parse(await response.arrayBuffer());
}

export function loadFont(file: string) {
    const cachedFont = fontCache.get(file);
    if (cachedFont) return cachedFont;

    const font = fetchFont(file);
    fontCache.set(file, font);
    void font.catch(() => {
        if (fontCache.get(file) === font) fontCache.delete(file);
    });

    return font;
}
