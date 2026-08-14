import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";
import opentype from "opentype.js";
import * as THREE from "three";

export const RUSSIAN_ALPHABET =
  "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" +
  "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

export const CONTOUR_SAMPLES = [
  "Сергей",
  "София",
  "Александр",
  "Ёжик",
  "Рост 52 см",
];

const LICENSE_FILES = ["OFL.txt", "LICENSE.txt", "LICENSE"];
const FONT_EXTENSIONS = new Set([".ttf", ".otf"]);

function loadFont(fontPath) {
  const data = readFileSync(fontPath);
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return opentype.parse(arrayBuffer);
}

function missingGlyphs(font, text) {
  return Array.from(new Set(Array.from(text).filter(
    (character) => !/\s/u.test(character) && font.charToGlyph(character).index === 0,
  )));
}

function createGlyphRun(font, text, size = 100) {
  const glyphs = Array.from(text, (character) => font.charToGlyph(character));
  const fontScale = size / font.unitsPerEm;
  const commands = [];
  const bounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  let cursorX = 0;

  for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex += 1) {
    const glyph = glyphs[glyphIndex];
    const path = glyph.getPath(cursorX, 0, size);
    commands.push(...path.commands);

    if (path.commands.length > 0) {
      const glyphBounds = path.getBoundingBox();
      bounds.x1 = Math.min(bounds.x1, glyphBounds.x1);
      bounds.y1 = Math.min(bounds.y1, glyphBounds.y1);
      bounds.x2 = Math.max(bounds.x2, glyphBounds.x2);
      bounds.y2 = Math.max(bounds.y2, glyphBounds.y2);
    }

    cursorX += (glyph.advanceWidth ?? font.unitsPerEm) * fontScale;
    if (glyphIndex < glyphs.length - 1) {
      cursorX += font.getKerningValue(glyph, glyphs[glyphIndex + 1]) * fontScale;
    }
  }

  return { commands, bounds };
}

function assertFiniteGlyphRun(run, label) {
  if (run.commands.length === 0) {
    throw new Error(`${label}: контур пуст`);
  }

  for (const command of run.commands) {
    for (const key of ["x", "y", "x1", "y1", "x2", "y2"]) {
      const value = command[key];
      if (value !== undefined && !Number.isFinite(value)) {
        throw new Error(`${label}: координата ${key} содержит NaN/Infinity`);
      }
    }
  }

  const { bounds } = run;
  const values = [bounds.x1, bounds.y1, bounds.x2, bounds.y2];
  if (!values.every(Number.isFinite) || bounds.x2 <= bounds.x1 || bounds.y2 <= bounds.y1) {
    throw new Error(`${label}: некорректный bounding box`);
  }
}

function assertExtrudableGlyphRun(run, label) {
  const shapePath = new THREE.ShapePath();

  for (const command of run.commands) {
    switch (command.type) {
      case "M": shapePath.moveTo(command.x, -command.y); break;
      case "L": shapePath.lineTo(command.x, -command.y); break;
      case "C":
        shapePath.bezierCurveTo(
          command.x1,
          -command.y1,
          command.x2,
          -command.y2,
          command.x,
          -command.y,
        );
        break;
      case "Q":
        shapePath.quadraticCurveTo(command.x1, -command.y1, command.x, -command.y);
        break;
      case "Z": shapePath.currentPath?.closePath(); break;
    }
  }

  let shapes;
  try {
    shapes = shapePath.toShapes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: THREE.ShapePath не построил фигуры (${message})`);
  }
  if (shapes.length === 0) {
    throw new Error(`${label}: THREE.ShapePath не создал фигур`);
  }

  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 2,
    bevelEnabled: false,
    curveSegments: 6,
  });
  const position = geometry.getAttribute("position");

  try {
    if (!position || position.count === 0) {
      throw new Error(`${label}: ExtrudeGeometry пуста`);
    }
    for (let index = 0; index < position.array.length; index += 1) {
      if (!Number.isFinite(position.array[index])) {
        throw new Error(`${label}: ExtrudeGeometry содержит NaN/Infinity`);
      }
    }
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box || ![
      box.min.x, box.min.y, box.min.z,
      box.max.x, box.max.y, box.max.z,
    ].every(Number.isFinite)) {
      throw new Error(`${label}: ExtrudeGeometry имеет некорректный bounding box`);
    }
  } finally {
    geometry.dispose();
  }
}

function verifyFont(fontPath) {
  const font = loadFont(fontPath);
  const missingRussian = missingGlyphs(font, RUSSIAN_ALPHABET);
  if (missingRussian.length > 0) {
    throw new Error(`нет символов ${missingRussian.join("")}`);
  }

  assertFiniteGlyphRun(createGlyphRun(font, RUSSIAN_ALPHABET), "русский алфавит");

  for (const sample of CONTOUR_SAMPLES) {
    const missing = missingGlyphs(font, sample);
    if (missing.length > 0) {
      throw new Error(`строка «${sample}»: нет символов ${missing.join("")}`);
    }
    const run = createGlyphRun(font, sample);
    assertFiniteGlyphRun(run, `строка «${sample}»`);
    assertExtrudableGlyphRun(run, `строка «${sample}»`);
  }
}

function collectFontPaths(path) {
  if (statSync(path).isFile()) {
    return FONT_EXTENSIONS.has(extname(path).toLowerCase()) ? [path] : [];
  }

  return readdirSync(path)
    .flatMap((entry) => collectFontPaths(resolve(path, entry)));
}

function readCatalogFontPaths() {
  const catalogSource = readFileSync(resolve("src/fonts/fontCatalog.ts"), "utf8");
  const publicPaths = Array.from(
    catalogSource.matchAll(/file:\s*"(?<path>\/fonts\/catalog\/[^"]+\.(?:ttf|otf))"/giu),
    (match) => match.groups.path,
  );

  if (publicPaths.length === 0) {
    throw new Error("В fontCatalog.ts не найдены пути TTF/OTF.");
  }
  if (new Set(publicPaths).size !== publicPaths.length) {
    throw new Error("В fontCatalog.ts найдены повторяющиеся пути шрифтов.");
  }

  const fontPaths = publicPaths.map((publicPath) => resolve("public", publicPath.slice(1)));
  const missingFiles = fontPaths.filter((fontPath) => !existsSync(fontPath));
  if (missingFiles.length > 0) {
    throw new Error(`Файлы из каталога не найдены: ${missingFiles.join(", ")}`);
  }

  const filesOnDisk = collectFontPaths(resolve("public/fonts/catalog"));
  const catalogFiles = new Set(fontPaths.map((fontPath) => resolve(fontPath).toLowerCase()));
  const unlistedFiles = filesOnDisk.filter(
    (fontPath) => !catalogFiles.has(resolve(fontPath).toLowerCase()),
  );
  if (unlistedFiles.length > 0) {
    throw new Error(`TTF/OTF отсутствуют в fontCatalog.ts: ${unlistedFiles.join(", ")}`);
  }

  return fontPaths;
}

function assertLicense(fontPath) {
  const familyDirectory = dirname(fontPath);
  const hasLicense = LICENSE_FILES.some((fileName) => existsSync(resolve(familyDirectory, fileName)));
  if (!hasLicense) {
    throw new Error("рядом со шрифтом нет OFL.txt/LICENSE.txt");
  }
}

const requestedPaths = process.argv.slice(2);
let fontPaths;

try {
  fontPaths = (requestedPaths.length > 0
    ? requestedPaths.flatMap((path) => collectFontPaths(resolve(path)))
    : readCatalogFontPaths()
  ).sort();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL catalog: ${message}`);
  process.exit(1);
}

if (fontPaths.length === 0) {
  console.error("Укажите хотя бы один путь к TTF/OTF.");
  process.exit(2);
}

let hasErrors = false;
let passedCount = 0;

for (const fontPath of fontPaths) {
  const label = requestedPaths.length > 0
    ? `${basename(dirname(fontPath))}/${basename(fontPath)}`
    : relative(resolve("public/fonts/catalog"), fontPath).replaceAll("\\", "/");

  try {
    assertLicense(fontPath);
    verifyFont(fontPath);
    passedCount += 1;
    console.log(
      `PASS ${label}: ${RUSSIAN_ALPHABET.length} русских букв, ` +
      `${CONTOUR_SAMPLES.length} контуров и ExtrudeGeometry, лицензия найдена`,
    );
  } catch (error) {
    hasErrors = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${label}: ${message}`);
  }
}

console.log(`Проверено шрифтов: ${fontPaths.length}; успешно: ${passedCount}.`);

if (hasErrors) {
  process.exit(1);
}
