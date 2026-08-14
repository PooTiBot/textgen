import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { unzipSync } from "fflate";
import { parse, type Font } from "opentype.js";
import type { DecorationItem } from "../src/decorations/types";
import { createPartsZipArchive } from "../src/export/exportStl";
import {
  createExportSnapshot,
  createMergedExportGeometry,
  validateExportGeometry,
} from "../src/export/geometryUtils";
import type { PrintablePart } from "../src/parts/PrintablePart";
import { buildPrintableParts } from "../src/parts/buildPrintableParts";
import { createPanelFrameGeometry, createPanelGeometry } from "../src/panel/geometry";
import type { PanelSettings, PanelShape } from "../src/panel/types";
import type { ExtraTextItem } from "../src/textItems/types";

function makePart(
  id: string,
  type: PrintablePart["type"],
  fileName: string,
  geometry: THREE.BufferGeometry,
  matrix: THREE.Matrix4,
): PrintablePart {
  return {
    id,
    type,
    name: id,
    fileName,
    geometry,
    matrix,
    enabled: true,
    previewVisible: true,
  };
}

function assertClose(label: string, actual: number, expected: number, tolerance = 0.02) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label}: expected ${expected} mm, received ${actual} mm.`);
  }
}

function partBox(parts: readonly PrintablePart[], id: string) {
  const part = parts.find((candidate) => candidate.id === id);
  if (!part) throw new Error(`Missing printable part: ${id}.`);
  part.geometry.computeBoundingBox();
  return part.geometry.boundingBox!;
}

const PANEL_BASE: PanelSettings = {
  enabled: true,
  shape: "rectangle",
  autoSize: false,
  width: 240,
  height: 140,
  thickness: 8,
  padding: 20,
  offsetZ: 2,
  frameEnabled: true,
  frameWidth: 5,
  frameDepth: 3,
  frameOffsetZ: 0,
};

const Z_DECORATIONS: readonly DecorationItem[] = [
  { id: "star", type: "star", x: -90, y: -45, z: 0, size: 26, depth: 1, rotation: 0, enabled: true },
  { id: "butterfly", type: "butterfly", x: -30, y: -45, z: 0, size: 26, depth: 4, rotation: 0, enabled: true },
  { id: "heart", type: "heart", x: 30, y: -45, z: 0, size: 26, depth: 8, rotation: 0, enabled: true },
  { id: "cloud", type: "cloud", x: 90, y: -45, z: 0, size: 26, depth: 2.5, rotation: 0, enabled: true },
  { id: "moon", type: "moon", x: -60, y: 12, z: 0, size: 26, depth: 5.5, rotation: 0, enabled: true },
  { id: "crown", type: "crown", x: 65, y: 12, z: 0, size: 26, depth: 10, rotation: 0, enabled: true },
];

const Z_EXTRA_TEXT: readonly ExtraTextItem[] = [
  { id: "height", text: "Рост 52 см", fontId: "test", x: -45, y: 48, z: 0, size: 16, depth: 2, rotation: 0, enabled: true },
  { id: "weight", text: "3200 г", fontId: "test", x: 55, y: 48, z: 0, size: 16, depth: 6, rotation: 0, enabled: true },
];

function runZPlacementCase(
  font: Font,
  settings: {
    label: string;
    initialText?: string;
    panelThickness: number;
    panelOffsetZ: number;
    initialDepth: number;
    nameDepth: number;
    pocketEnabled?: boolean;
  },
) {
  const built = buildPrintableParts({
    initialText: settings.initialText ?? "П",
    text: "Пример",
    initialDepth: settings.initialDepth,
    nameDepth: settings.nameDepth,
    initialSize: 90,
    nameSize: 28,
    initialOffsetX: 0,
    initialOffsetY: 0,
    nameOffsetX: 0,
    nameOffsetY: 0,
    panelSettings: {
      ...PANEL_BASE,
      thickness: settings.panelThickness,
      offsetZ: settings.panelOffsetZ,
    },
    decorations: Z_DECORATIONS,
    extraTextItems: Z_EXTRA_TEXT,
    pocketSettings: {
      enabled: settings.pocketEnabled ?? false,
      tolerance: 0.2,
      depth: 2,
    },
    showMainName: true,
    fonts: {
      initial: font,
      name: font,
      extra: new Map([["test", font]]),
    },
  });

  if (built.panelFrontZ === null) {
    throw new Error(`${settings.label}: panelFrontZ was not calculated.`);
  }

  const panelFrontZ = built.panelFrontZ;
  assertClose(`${settings.label}/panelFrontZ`, panelFrontZ, -settings.panelOffsetZ);
  assertClose(`${settings.label}/panel thickness`, partBox(built.parts, "panel").getSize(new THREE.Vector3()).z, settings.panelThickness);
  assertClose(`${settings.label}/initial back contact`, partBox(built.parts, "initial").min.z, panelFrontZ);
  assertClose(`${settings.label}/name back contact`, partBox(built.parts, "name").min.z, panelFrontZ);
  assertClose(`${settings.label}/initial depth`, partBox(built.parts, "initial").getSize(new THREE.Vector3()).z, settings.initialDepth);
  assertClose(`${settings.label}/name depth`, partBox(built.parts, "name").getSize(new THREE.Vector3()).z, settings.nameDepth);
  assertClose(`${settings.label}/frame depth`, partBox(built.parts, "frame").getSize(new THREE.Vector3()).z, PANEL_BASE.frameDepth);

  for (const decoration of Z_DECORATIONS) {
    const box = partBox(built.parts, `decoration:${decoration.id}`);
    assertClose(`${settings.label}/${decoration.id} back contact`, box.min.z, panelFrontZ + decoration.z);
    assertClose(`${settings.label}/${decoration.id} depth`, box.getSize(new THREE.Vector3()).z, decoration.depth);
  }

  for (const item of Z_EXTRA_TEXT) {
    const box = partBox(built.parts, `extra-text:${item.id}`);
    assertClose(`${settings.label}/${item.id} back contact`, box.min.z, panelFrontZ + item.z);
    assertClose(`${settings.label}/${item.id} depth`, box.getSize(new THREE.Vector3()).z, item.depth);
  }

  if (settings.pocketEnabled && !built.pocketCreated) {
    throw new Error(`${settings.label}: tolerance pocket was not created.`);
  }

  built.parts.forEach((part) => validateExportGeometry(part.geometry));
  built.parts.forEach((part) => part.geometry.dispose());
}

function runDetachedInitialChecks(font: Font) {
  const cases = [
    { initialText: "П", text: "Пример", pocketEnabled: false },
    { initialText: "И", text: "София", pocketEnabled: true },
    { initialText: "М", text: "Александр", pocketEnabled: false },
    { initialText: "", text: "София", pocketEnabled: true },
  ];

  cases.forEach((testCase) => {
    const built = buildPrintableParts({
      initialText: testCase.initialText,
      text: testCase.text,
      initialDepth: 8,
      nameDepth: 4,
      initialSize: 100,
      nameSize: 32,
      initialOffsetX: 0,
      initialOffsetY: 0,
      nameOffsetX: 0,
      nameOffsetY: 0,
      panelSettings: { ...PANEL_BASE, autoSize: true },
      decorations: [],
      extraTextItems: [],
      pocketSettings: {
        enabled: testCase.pocketEnabled,
        tolerance: 0.2,
        depth: 2,
      },
      showMainName: true,
      fonts: { initial: font, name: font, extra: new Map() },
    });
    const hasInitialPart = built.parts.some((part) => part.id === "initial");

    if (hasInitialPart !== Boolean(testCase.initialText)) {
      throw new Error(
        `${testCase.initialText || "empty"}/${testCase.text}: unexpected initial part state.`,
      );
    }
    if (testCase.pocketEnabled && testCase.initialText && !built.pocketCreated) {
      throw new Error(`${testCase.initialText}/${testCase.text}: tolerance pocket was not created.`);
    }
    if (!testCase.initialText && built.pocketCreated) {
      throw new Error(`${testCase.text}: empty initial unexpectedly created a pocket.`);
    }

    createExportSnapshot(built.parts);
    built.parts.forEach((part) => validateExportGeometry(part.geometry));
    built.parts.forEach((part) => part.geometry.dispose());
  });

  return cases.length;
}

export function runExportGeometryCheck(fontBuffer: ArrayBuffer) {
  const panel = createPanelGeometry("rectangle", 180, 100, 8);
  const frame = createPanelFrameGeometry("rectangle", 180, 100, 5, 3);
  const initialMarker = new THREE.BoxGeometry(30, 20, 8);
  initialMarker.translate(-20, 0, 5);
  const marker = new THREE.BoxGeometry(24, 12, 4);
  marker.translate(0, 0, 7);
  const compositionMatrix = new THREE.Matrix4().makeTranslation(14, -9, 0);
  const parts = [
    makePart("panel", "backPanel", "panel", panel, compositionMatrix),
    makePart("frame", "panelFrame", "frame", frame, compositionMatrix),
    makePart("initial", "initialLetter", "initial", initialMarker, compositionMatrix),
    makePart("marker", "mainName", "name", marker, compositionMatrix),
  ];
  const snapshot = createExportSnapshot(parts);
  const geometry = createMergedExportGeometry(snapshot.parts);
  const tolerance = 0.05;

  if (Math.abs(snapshot.size.width - 180) > tolerance) {
    throw new Error(`Expected export width 180 mm, received ${snapshot.size.width} mm.`);
  }

  if (Math.abs(snapshot.size.height - 100) > tolerance) {
    throw new Error(`Expected export height 100 mm, received ${snapshot.size.height} mm.`);
  }

  const binary = new STLExporter().parse(new THREE.Mesh(geometry), { binary: true });
  if (binary.byteLength <= 84) {
    throw new Error("Binary STL is empty.");
  }
  const archiveFiles = unzipSync(createPartsZipArchive(snapshot));
  const expectedFiles = ["panel.stl", "frame.stl", "initial.stl", "name.stl"];
  expectedFiles.forEach((fileName) => {
    if (!archiveFiles[fileName] || archiveFiles[fileName].byteLength <= 84) {
      throw new Error(`Separate STL archive is missing ${fileName}.`);
    }
  });

  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(0, 0, 20),
    new THREE.Vector3(0, 0, -1),
  );
  const frameShapes: PanelShape[] = ["rectangle", "rounded-rectangle", "oval"];
  frameShapes.forEach((shape) => {
    const ring = createPanelFrameGeometry(shape, 180, 100, 5, 3);
    const ringMesh = new THREE.Mesh(ring);
    ringMesh.updateMatrixWorld(true);
    if (raycaster.intersectObject(ringMesh).length > 0) {
      ring.dispose();
      throw new Error(`${shape} frame is solid instead of ring-shaped.`);
    }
    ring.dispose();
  });

  const font = parse(fontBuffer);
  const zCases = [
    { label: "A", panelThickness: 3, panelOffsetZ: 2, initialDepth: 12, nameDepth: 2 },
    { label: "B", panelThickness: 6, panelOffsetZ: 7, initialDepth: 12, nameDepth: 8 },
    { label: "C", panelThickness: 8, panelOffsetZ: 1, initialDepth: 3, nameDepth: 10 },
    { label: "D", panelThickness: 8, panelOffsetZ: 5, initialDepth: 10, nameDepth: 2 },
    { label: "Tolerance", panelThickness: 6, panelOffsetZ: 3, initialDepth: 8, nameDepth: 6, pocketEnabled: true },
  ];
  zCases.forEach((settings) => runZPlacementCase(font, settings));
  const detachedCases = runDetachedInitialChecks(font);

  const result = {
    width: snapshot.size.width,
    height: snapshot.size.height,
    depth: snapshot.size.depth,
    vertices: geometry.getAttribute("position").count,
    stlBytes: binary.byteLength,
    parts: snapshot.partCount,
    zCases: zCases.length,
    detachedCases,
  };

  panel.dispose();
  frame.dispose();
  initialMarker.dispose();
  marker.dispose();
  geometry.dispose();
  return result;
}
