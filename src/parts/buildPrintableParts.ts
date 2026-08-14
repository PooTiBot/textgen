import type { Font } from "opentype.js";
import * as THREE from "three";
import { createDecorationGeometry } from "../decorations/geometry";
import type { DecorationItem } from "../decorations/types";
import { createPanelFrameGeometry, createPanelGeometry, getAutoPanelDimensions } from "../panel/geometry";
import type { PanelSettings } from "../panel/types";
import { createExtraTextGeometry, createGeometryFromShapes, createTextShapes } from "../textItems/geometry";
import type { ExtraTextItem } from "../textItems/types";
import { createNamePocket } from "../tolerance/createNamePocket";
import { shapesToClipperPaths, transformClipperPaths } from "../tolerance/polygonUtils";
import type { NamePocketSettings } from "../tolerance/types";
import type { PrintablePart } from "./PrintablePart";

type Bounds2D = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type CompositionFonts = {
  initial: Font;
  name: Font;
  extra: ReadonlyMap<string, Font>;
};

export type BuildPrintablePartsOptions = {
  text: string;
  depth: number;
  initialSize: number;
  nameSize: number;
  initialOffsetX: number;
  initialOffsetY: number;
  nameOffsetX: number;
  nameOffsetY: number;
  panelSettings: PanelSettings;
  decorations: readonly DecorationItem[];
  extraTextItems: readonly ExtraTextItem[];
  pocketSettings: NamePocketSettings;
  showMainName: boolean;
  fonts: CompositionFonts;
};

export type BuiltPrintableParts = {
  parts: readonly PrintablePart[];
  previewScale: number;
  centerX: number;
  centerY: number;
  pocketCreated: boolean;
};

function expandBounds(bounds: Bounds2D, box: THREE.Box3) {
  bounds.minX = Math.min(bounds.minX, box.min.x);
  bounds.maxX = Math.max(bounds.maxX, box.max.x);
  bounds.minY = Math.min(bounds.minY, box.min.y);
  bounds.maxY = Math.max(bounds.maxY, box.max.y);
}

function createPart(
  id: string,
  type: PrintablePart["type"],
  name: string,
  fileName: string,
  geometry: THREE.BufferGeometry,
  previewVisible = true,
): PrintablePart {
  return {
    id,
    type,
    name,
    fileName,
    geometry,
    matrix: new THREE.Matrix4(),
    enabled: true,
    previewVisible,
  };
}

export function buildPrintableParts(options: BuildPrintablePartsOptions): BuiltPrintableParts {
  const clean = options.text.trim();
  const initial = Array.from(clean)[0].toLocaleUpperCase("ru-RU");
  const initialShapes = createTextShapes(options.fonts.initial, initial, options.initialSize);
  const nameShapes = createTextShapes(options.fonts.name, clean, options.nameSize);
  let initialGeometry: THREE.BufferGeometry = createGeometryFromShapes(
    initialShapes,
    options.depth,
    !options.pocketSettings.enabled,
    options.initialSize,
  );
  const nameGeometry = createGeometryFromShapes(
    nameShapes,
    options.depth + 0.8,
    !options.pocketSettings.enabled,
    options.nameSize,
  );
  const initialBounds = initialGeometry.boundingBox!;
  const nameBounds = nameGeometry.boundingBox!;
  const initialWidth = initialBounds.max.x - initialBounds.min.x;
  const initialX = -initialBounds.min.x + options.initialOffsetX;
  const initialY = -(initialBounds.min.y + initialBounds.max.y) / 2 + options.initialOffsetY;
  const nameX = initialWidth * 0.34 - nameBounds.min.x + options.nameOffsetX;
  const nameY = -(nameBounds.min.y + nameBounds.max.y) / 2 + options.nameOffsetY;
  const initialPaths = transformClipperPaths(
    shapesToClipperPaths(initialShapes),
    initialX,
    initialY,
  );
  const namePaths = transformClipperPaths(
    shapesToClipperPaths(nameShapes),
    nameX,
    nameY,
  );
  const pocketResult = createNamePocket(
    initialPaths,
    namePaths,
    options.depth,
    options.pocketSettings,
  );

  if (pocketResult) {
    initialGeometry.dispose();
    initialGeometry = pocketResult.geometry;
  } else {
    initialGeometry.translate(initialX, initialY, 0);
    initialGeometry.computeBoundingBox();
  }

  nameGeometry.translate(nameX, nameY, options.depth * 0.18);
  nameGeometry.computeBoundingBox();

  const initialPart = createPart(
    "initial",
    "initialLetter",
    "Большая буква",
    "initial",
    initialGeometry,
  );
  const namePart = createPart(
    "name",
    "mainName",
    "Основное имя",
    "name",
    nameGeometry,
    options.showMainName,
  );
  const decorationParts = options.decorations
    .filter((item) => item.enabled)
    .map((item, index) => createPart(
      `decoration:${item.id}`,
      "decoration",
      `Декор ${index + 1}`,
      `decoration-${index + 1}`,
      createDecorationGeometry(item),
    ));
  const extraTextParts = options.extraTextItems
    .filter((item) => item.enabled && item.text.trim() && options.fonts.extra.has(item.fontId))
    .map((item, index) => {
    const font = options.fonts.extra.get(item.fontId);
    return createPart(
        `extra-text:${item.id}`,
        "extraText",
        `Дополнительный текст ${index + 1}`,
        `text-${index + 1}`,
        createExtraTextGeometry(font!, item),
      );
    });
  const contentParts = [initialPart, namePart, ...decorationParts, ...extraTextParts];
  const initialBox = initialGeometry.boundingBox!;
  const contentBounds: Bounds2D = {
    minX: initialBox.min.x,
    maxX: initialBox.max.x,
    minY: initialBox.min.y,
    maxY: initialBox.max.y,
  };

  contentParts.slice(1).forEach((part) => {
    part.geometry.computeBoundingBox();
    expandBounds(contentBounds, part.geometry.boundingBox!);
  });

  const contentWidth = contentBounds.maxX - contentBounds.minX;
  const contentHeight = contentBounds.maxY - contentBounds.minY;
  const contentCenterX = (contentBounds.minX + contentBounds.maxX) / 2;
  const contentCenterY = (contentBounds.minY + contentBounds.maxY) / 2;
  const panelParts: PrintablePart[] = [];

  if (options.panelSettings.enabled) {
    const panelDimensions = options.panelSettings.autoSize
      ? getAutoPanelDimensions(
        options.panelSettings.shape,
        contentWidth,
        contentHeight,
        options.panelSettings.padding,
      )
      : { width: options.panelSettings.width, height: options.panelSettings.height };
    const panelGeometry = createPanelGeometry(
      options.panelSettings.shape,
      panelDimensions.width,
      panelDimensions.height,
      options.panelSettings.thickness,
    );
    const panelBox = panelGeometry.boundingBox!;
    panelGeometry.translate(
      contentCenterX - (panelBox.min.x + panelBox.max.x) / 2,
      contentCenterY - (panelBox.min.y + panelBox.max.y) / 2,
      -options.panelSettings.offsetZ - panelBox.max.z,
    );
    panelGeometry.computeBoundingBox();
    panelParts.push(createPart(
      "panel",
      "backPanel",
      "Задняя панель",
      "panel",
      panelGeometry,
    ));

    if (options.panelSettings.frameEnabled) {
      const frameGeometry = createPanelFrameGeometry(
        options.panelSettings.shape,
        panelDimensions.width,
        panelDimensions.height,
        options.panelSettings.frameWidth,
        options.panelSettings.frameDepth,
      );
      const frameBox = frameGeometry.boundingBox!;
      const translatedPanelBox = panelGeometry.boundingBox!;
      frameGeometry.translate(
        contentCenterX - (frameBox.min.x + frameBox.max.x) / 2,
        contentCenterY - (frameBox.min.y + frameBox.max.y) / 2,
        translatedPanelBox.max.z + options.panelSettings.frameOffsetZ - frameBox.min.z,
      );
      frameGeometry.computeBoundingBox();
      panelParts.push(createPart(
        "frame",
        "panelFrame",
        "Рамка панели",
        "frame",
        frameGeometry,
      ));
    }
  }

  const parts = [...panelParts, ...contentParts];
  const compositionBox = new THREE.Box3();
  parts.forEach((part) => {
    part.geometry.computeBoundingBox();
    compositionBox.union(part.geometry.boundingBox!);
  });
  const compositionSize = compositionBox.getSize(new THREE.Vector3());
  const compositionCenter = compositionBox.getCenter(new THREE.Vector3());
  const previewScale = 4.8 / Math.max(compositionSize.x, compositionSize.y, 1);
  const compositionMatrix = new THREE.Matrix4().makeTranslation(
    -compositionCenter.x,
    -compositionCenter.y,
    0,
  );
  parts.forEach((part) => {
    part.matrix.copy(compositionMatrix);
  });

  return {
    parts,
    previewScale,
    centerX: compositionCenter.x,
    centerY: compositionCenter.y,
    pocketCreated: Boolean(pocketResult),
  };
}
