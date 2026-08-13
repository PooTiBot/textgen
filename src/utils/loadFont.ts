import opentype from "opentype.js";

const FONT_URL = "/fonts/TextGen3D-Sans.ttf";

export async function loadFont() {
    const response = await fetch(FONT_URL);

    if (!response.ok) {
        throw new Error(`Не удалось загрузить шрифт: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return opentype.parse(buffer);
}
