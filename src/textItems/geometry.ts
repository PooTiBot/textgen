import * as THREE from "three";
import type { Font } from "opentype.js";
import type { ExtraTextItem } from "./types";

export function createTextShapes(font: Font, text: string, size: number) {
    const shapePath = new THREE.ShapePath();
    const glyphs = Array.from(text, (character) => font.charToGlyph(character));
    const fontScale = size / font.unitsPerEm;
    let cursorX = 0;

    for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex += 1) {
        const glyph = glyphs[glyphIndex];
        const path = glyph.getPath(cursorX, 0, size);

        for (const command of path.commands) {
            switch (command.type) {
                case "M": shapePath.moveTo(command.x, -command.y); break;
                case "L": shapePath.lineTo(command.x, -command.y); break;
                case "C":
                    shapePath.bezierCurveTo(command.x1, -command.y1, command.x2, -command.y2, command.x, -command.y);
                    break;
                case "Q":
                    shapePath.quadraticCurveTo(command.x1, -command.y1, command.x, -command.y);
                    break;
                case "Z": shapePath.currentPath?.closePath(); break;
            }
        }

        cursorX += (glyph.advanceWidth ?? font.unitsPerEm) * fontScale;

        if (glyphIndex < glyphs.length - 1) {
            cursorX += font.getKerningValue(glyph, glyphs[glyphIndex + 1]) * fontScale;
        }
    }

    return shapePath.toShapes();
}

export function createTextGeometry(font: Font, text: string, size: number, depth: number) {
    return createGeometryFromShapes(createTextShapes(font, text, size), depth, true, size);
}

export function createGeometryFromShapes(
    shapes: readonly THREE.Shape[],
    depth: number,
    bevelEnabled: boolean,
    referenceSize = 40,
) {
    const bevelThickness = bevelEnabled ? Math.min(1.2, depth * 0.12) : 0;
    const extrusionDepth = Math.max(0.01, depth - bevelThickness * 2);
    const geometry = new THREE.ExtrudeGeometry([...shapes], {
        depth: extrusionDepth,
        bevelEnabled,
        bevelThickness,
        bevelSize: Math.min(0.8, referenceSize * 0.025),
        bevelSegments: 3,
        curveSegments: 12,
    });
    geometry.computeBoundingBox();
    return geometry;
}

export function createExtraTextGeometry(font: Font, item: ExtraTextItem) {
    const geometry = createTextGeometry(font, item.text.trim(), item.size, item.depth);
    const bounds = geometry.boundingBox!;

    geometry.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -(bounds.min.y + bounds.max.y) / 2,
        0,
    );
    geometry.rotateZ(THREE.MathUtils.degToRad(item.rotation));
    geometry.translate(item.x, item.y, item.z);
    geometry.computeBoundingBox();
    return geometry;
}
