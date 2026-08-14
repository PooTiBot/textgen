import { getBoundsPathsD } from "clipper2-ts";
import type { Font } from "opentype.js";
import { createDecorationGeometry } from "../../decorations/geometry";
import type { DecorationItem } from "../../decorations/types";
import { createPrintablePart } from "../../parts/createPrintablePart";
import {
  finalizePrintableParts,
  type FinalizedPrintableParts,
} from "../../parts/finalizePrintableParts";
import { placeGeometryBackAt } from "../../parts/zPlacement";
import { createTextShapes } from "../../textItems/geometry";
import {
  createLedBaseGeometry,
  createLedCapsGeometry,
  createLedLetterContours,
  createLedWallsGeometry,
} from "./geometry";
import type { LedSignSettings } from "./types";

export type BuiltLedSignParts = FinalizedPrintableParts & {
  effectiveTextSize: number;
  capFits: boolean;
};

function getEffectiveTextSize(font: Font, settings: LedSignSettings, text: string) {
  if (!settings.autoFit) return settings.textSize;
  const shapes = createTextShapes(font, text, settings.textSize, settings.letterSpacing);
  const contours = createLedLetterContours(shapes, settings);
  const bounds = getBoundsPathsD(contours.outerPaths);
  const width = Math.max(0.01, bounds.right - bounds.left);
  const height = Math.max(0.01, bounds.bottom - bounds.top);
  const scale = Math.min(
    1,
    settings.maxWidth / width,
    settings.maxHeight / height,
  );
  return Math.max(5, settings.textSize * scale);
}

export function buildLedSignParts(
  settings: LedSignSettings,
  font: Font,
  decorations: readonly DecorationItem[],
): BuiltLedSignParts {
  const cleanText = settings.text.trim();
  if (!cleanText) throw new Error("Текст LED-вывески не может быть пустым.");
  const effectiveTextSize = getEffectiveTextSize(font, settings, cleanText);
  const shapes = createTextShapes(font, cleanText, effectiveTextSize, settings.letterSpacing);
  const contours = createLedLetterContours(shapes, settings);
  if (contours.outerPaths.length === 0 || contours.wallPaths.length === 0 || contours.capPaths.length === 0) {
    throw new Error("Выбранный шрифт слишком тонкий для заданной толщины стенок.");
  }
  const baseGeometry = createLedBaseGeometry(contours, settings);
  const wallsGeometry = createLedWallsGeometry(contours, settings);
  const capsGeometry = createLedCapsGeometry(contours, settings);
  const basePart = createPrintablePart(
    "led-base",
    "ledBase",
    "Задняя основа световых букв",
    "led-base",
    baseGeometry,
    settings.showBase,
  );
  const wallsPart = createPrintablePart(
    "led-walls",
    "ledWalls",
    "Полые стенки световых букв",
    "led-walls",
    wallsGeometry,
    settings.showWalls,
  );
  const capsPart = createPrintablePart(
    "led-caps",
    "ledCaps",
    "Передние крышки световых букв",
    "led-caps",
    capsGeometry,
    settings.showCaps,
  );
  const decorationParts = decorations
    .filter((item) => item.enabled)
    .map((item, index) => {
      const geometry = createDecorationGeometry(item);
      placeGeometryBackAt(geometry, settings.baseThickness + settings.wallHeight + item.z);
      return createPrintablePart(
        `decoration:${item.id}`,
        "decoration",
        `Декор ${index + 1}`,
        `decoration-${index + 1}`,
        geometry,
      );
    });
  const finalized = finalizePrintableParts([
    basePart,
    wallsPart,
    capsPart,
    ...decorationParts,
  ]);

  return {
    ...finalized,
    effectiveTextSize,
    capFits: contours.capGroups.every((paths, index) => {
      const cap = getBoundsPathsD(paths);
      const cavity = getBoundsPathsD(contours.innerGroups[index]);
      return cap.left >= cavity.left
        && cap.right <= cavity.right
        && cap.top >= cavity.top
        && cap.bottom <= cavity.bottom;
    }),
  };
}
