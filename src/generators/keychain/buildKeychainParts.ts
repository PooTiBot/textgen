import type { Font } from "opentype.js";
import * as THREE from "three";
import { createDecorationGeometry } from "../../decorations/geometry";
import type { DecorationItem } from "../../decorations/types";
import { createPrintablePart } from "../../parts/createPrintablePart";
import { finalizePrintableParts, type FinalizedPrintableParts } from "../../parts/finalizePrintableParts";
import { placeGeometryBackAt } from "../../parts/zPlacement";
import {
  createExtraTextGeometry,
  createGeometryFromShapes,
  createTextShapes,
} from "../../textItems/geometry";
import type { ExtraTextItem } from "../../textItems/types";
import { createNamePocket } from "../../tolerance/createNamePocket";
import { shapesToClipperPaths, transformClipperPaths } from "../../tolerance/polygonUtils";
import { createKeychainBaseGeometry, createKeychainBodyPaths } from "./geometry";
import type { KeychainSettings } from "./types";

export type BuiltKeychainParts = FinalizedPrintableParts & {
  effectiveTextSize: number;
  pocketCreated: boolean;
};

function getTextAvailableSize(settings: KeychainSettings) {
  let left = -settings.width / 2 + settings.padding;
  let right = settings.width / 2 - settings.padding;
  const bottom = -settings.height / 2 + settings.padding;
  const top = settings.height / 2 - settings.padding;

  if (settings.mountType === "hole" && settings.holeEnabled) {
    const reservedEdge = settings.holeDiameter / 2 + settings.padding;
    if (settings.holeX <= 0) left = Math.max(left, settings.holeX + reservedEdge);
    else right = Math.min(right, settings.holeX - reservedEdge);
  } else if (settings.mountType === "loop") {
    const reserved = Math.max(settings.padding, settings.loopOuterDiameter * 0.18);
    if (settings.loopSide === "left") left += reserved;
    else right -= reserved;
  }

  return {
    width: Math.max(1, 2 * Math.min(settings.textX - left, right - settings.textX)),
    height: Math.max(1, 2 * Math.min(settings.textY - bottom, top - settings.textY)),
  };
}

function getEffectiveTextSize(font: Font, settings: KeychainSettings, text: string) {
  if (!settings.autoFit) return settings.textSize;
  const geometry = createGeometryFromShapes(
    createTextShapes(font, text, settings.textSize),
    settings.textDepth,
    settings.textMode === "raised",
    settings.textSize,
  );
  const bounds = geometry.boundingBox!;
  const size = bounds.getSize(new THREE.Vector3());
  geometry.dispose();
  const available = getTextAvailableSize(settings);
  const scale = Math.min(
    1,
    available.width / Math.max(size.x, 0.01),
    available.height / Math.max(size.y, 0.01),
  );
  return Math.max(2, settings.textSize * scale);
}

export function buildKeychainParts(
  settings: KeychainSettings,
  font: Font,
  decorations: readonly DecorationItem[],
  extraTextItems: readonly ExtraTextItem[] = [],
  extraFonts: ReadonlyMap<string, Font> = new Map(),
): BuiltKeychainParts {
  const cleanText = settings.text.trim();
  const effectiveTextSize = cleanText
    ? getEffectiveTextSize(font, settings, cleanText)
    : 0;
  const { bodyPaths } = createKeychainBodyPaths(settings);
  const textShapes = cleanText ? createTextShapes(font, cleanText, effectiveTextSize) : [];
  const textGeometry = cleanText
    ? createGeometryFromShapes(
      textShapes,
      settings.textDepth,
      settings.textMode === "raised",
      effectiveTextSize,
    )
    : null;
  const rawTextBounds = textGeometry?.boundingBox;
  const textTranslateX = rawTextBounds
    ? -(rawTextBounds.min.x + rawTextBounds.max.x) / 2 + settings.textX
    : settings.textX;
  const textTranslateY = rawTextBounds
    ? -(rawTextBounds.min.y + rawTextBounds.max.y) / 2 + settings.textY
    : settings.textY;
  if (textGeometry) {
    textGeometry.translate(textTranslateX, textTranslateY, 0);
    textGeometry.computeBoundingBox();
  }
  const textPaths = textShapes.length > 0
    ? transformClipperPaths(shapesToClipperPaths(textShapes), textTranslateX, textTranslateY)
    : [];
  const pocket = settings.textMode === "inlay" && textPaths.length > 0
    ? createNamePocket(bodyPaths, textPaths, settings.thickness, {
      enabled: true,
      tolerance: settings.tolerance,
      depth: settings.pocketDepth,
    })
    : null;
  const baseGeometry = pocket?.geometry ?? createKeychainBaseGeometry(bodyPaths, settings.thickness);
  const baseFrontZ = baseGeometry.boundingBox!.max.z;

  if (textGeometry) {
    placeGeometryBackAt(
      textGeometry,
      settings.textMode === "inlay"
        ? baseFrontZ - Math.min(settings.thickness, settings.pocketDepth)
        : baseFrontZ,
    );
  }

  const basePart = createPrintablePart(
    "keychain-base",
    "keychainBase",
    "Основа брелока",
    "keychain-base",
    baseGeometry,
  );
  const textPart = textGeometry
    ? createPrintablePart(
      "keychain-text",
      "keychainText",
      "Текст брелока",
      "keychain-text",
      textGeometry,
    )
    : null;
  const decorationParts = decorations
    .filter((item) => item.enabled)
    .map((item, index) => {
      const geometry = createDecorationGeometry(item);
      placeGeometryBackAt(geometry, baseFrontZ + item.z);
      return createPrintablePart(
        `decoration:${item.id}`,
        "decoration",
        `Декор ${index + 1}`,
        `decoration-${index + 1}`,
        geometry,
      );
    });
  const extraTextParts = extraTextItems
    .filter((item) => item.enabled && item.text.trim() && extraFonts.has(item.fontId))
    .map((item, index) => {
      const geometry = createExtraTextGeometry(extraFonts.get(item.fontId)!, item);
      placeGeometryBackAt(geometry, baseFrontZ + item.z);
      return createPrintablePart(
        `extra-text:${item.id}`,
        "extraText",
        `Дополнительный текст ${index + 1}`,
        `keychain-extra-text-${index + 1}`,
        geometry,
      );
    });
  const finalized = finalizePrintableParts([
    basePart,
    ...(textPart ? [textPart] : []),
    ...decorationParts,
    ...extraTextParts,
  ]);

  return {
    ...finalized,
    effectiveTextSize,
    pocketCreated: Boolean(pocket),
  };
}
