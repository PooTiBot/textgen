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
import { placeGeometryBackAt, placeGeometryFrontAt } from "./zPlacement";

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
  initialText: string;
  text: string;
  initialDepth: number;
  nameDepth: number;
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
  centerZ: number;
  panelFrontZ: number | null;
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
  if (!clean) throw new Error("Полное имя не может быть пустым.");

  const cleanInitial = options.initialText.trim();
  const initialShapes = cleanInitial
    ? createTextShapes(options.fonts.initial, cleanInitial, options.initialSize)
    : [];
  const nameShapes = createTextShapes(options.fonts.name, clean, options.nameSize);
  let initialGeometry: THREE.BufferGeometry | null = cleanInitial
    ? createGeometryFromShapes(
      initialShapes,
      options.initialDepth,
      !options.pocketSettings.enabled,
      options.initialSize,
    )
    : null;
  const nameGeometry = createGeometryFromShapes(
    nameShapes,
    options.nameDepth,
    !options.pocketSettings.enabled,
    options.nameSize,
  );
  const initialBounds = initialGeometry?.boundingBox ?? null;
  const nameBounds = nameGeometry.boundingBox!;
  const initialWidth = initialBounds ? initialBounds.max.x - initialBounds.min.x : 0;
  const initialX = initialBounds ? -initialBounds.min.x + options.initialOffsetX : 0;
  const initialY = initialBounds
    ? -(initialBounds.min.y + initialBounds.max.y) / 2 + options.initialOffsetY
    : 0;
  const nameX = initialWidth * 0.34 - nameBounds.min.x + options.nameOffsetX;
  const nameY = -(nameBounds.min.y + nameBounds.max.y) / 2 + options.nameOffsetY;
  const initialPaths = initialGeometry
    ? transformClipperPaths(shapesToClipperPaths(initialShapes), initialX, initialY)
    : [];
  const namePaths = transformClipperPaths(
    shapesToClipperPaths(nameShapes),
    nameX,
    nameY,
  );
  const pocketResult = initialGeometry
    ? createNamePocket(
      initialPaths,
      namePaths,
      options.initialDepth,
      options.pocketSettings,
    )
    : null;

  if (initialGeometry) {
    if (pocketResult) {
      initialGeometry.dispose();
      initialGeometry = pocketResult.geometry;
    } else {
      initialGeometry.translate(initialX, initialY, 0);
      initialGeometry.computeBoundingBox();
    }
  }

  nameGeometry.translate(nameX, nameY, 0);
  nameGeometry.computeBoundingBox();

  const initialPart = initialGeometry
    ? createPart(
      "initial",
      "initialLetter",
      "Большая буква",
      "initial",
      initialGeometry,
    )
    : null;
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
  const contentParts = [
    ...(initialPart ? [initialPart] : []),
    namePart,
    ...decorationParts,
    ...extraTextParts,
  ];
  const contentBounds: Bounds2D = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  contentParts.forEach((part) => {
    part.geometry.computeBoundingBox();
    expandBounds(contentBounds, part.geometry.boundingBox!);
  });

  const contentWidth = contentBounds.maxX - contentBounds.minX;
  const contentHeight = contentBounds.maxY - contentBounds.minY;
  const contentCenterX = (contentBounds.minX + contentBounds.maxX) / 2;
  const contentCenterY = (contentBounds.minY + contentBounds.maxY) / 2;
  const panelParts: PrintablePart[] = [];
  let panelFrontZ: number | null = null;

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
      0,
    );
    panelFrontZ = placeGeometryFrontAt(panelGeometry, -options.panelSettings.offsetZ);
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
        0,
      );
      placeGeometryBackAt(
        frameGeometry,
        translatedPanelBox.max.z + options.panelSettings.frameOffsetZ,
      );
      panelParts.push(createPart(
        "frame",
        "panelFrame",
        "Рамка панели",
        "frame",
        frameGeometry,
      ));
    }
  }

  const contentBaseZ = panelFrontZ ?? 0;
  if (initialGeometry) placeGeometryBackAt(initialGeometry, contentBaseZ);
  placeGeometryBackAt(nameGeometry, contentBaseZ);
  decorationParts.forEach((part) => {
    const item = options.decorations.find(
      (decoration) => part.id === `decoration:${decoration.id}`,
    );
    if (item) placeGeometryBackAt(part.geometry, contentBaseZ + item.z);
  });
  extraTextParts.forEach((part) => {
    const item = options.extraTextItems.find(
      (extraText) => part.id === `extra-text:${extraText.id}`,
    );
    if (item) placeGeometryBackAt(part.geometry, contentBaseZ + item.z);
  });

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
    centerZ: compositionCenter.z,
    panelFrontZ,
    pocketCreated: Boolean(pocketResult),
  };
}
