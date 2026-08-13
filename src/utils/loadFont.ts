import * as opentype from "opentype.js";

export async function loadFont() {
    const response = await fetch("/fonts/ARIAL.TTF");

    if (!response.ok) {
        throw new Error(`Не удалось загрузить шрифт: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return opentype.parse(buffer);
}
