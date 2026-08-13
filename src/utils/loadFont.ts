import opentype from "opentype.js";
import { TEXTGEN_FONT_BASE64 } from "../assets/textGenFont";

function base64ToArrayBuffer(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

export async function loadFont() {
    return opentype.parse(base64ToArrayBuffer(TEXTGEN_FONT_BASE64));
}
