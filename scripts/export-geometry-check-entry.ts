import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { unzipSync } from "fflate";
import { createPartsZipArchive } from "../src/export/exportStl";
import {
  createExportSnapshot,
  createMergedExportGeometry,
} from "../src/export/geometryUtils";
import type { PrintablePart } from "../src/parts/PrintablePart";
import { createPanelFrameGeometry, createPanelGeometry } from "../src/panel/geometry";
import type { PanelShape } from "../src/panel/types";

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

export function runExportGeometryCheck() {
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

  const result = {
    width: snapshot.size.width,
    height: snapshot.size.height,
    depth: snapshot.size.depth,
    vertices: geometry.getAttribute("position").count,
    stlBytes: binary.byteLength,
    parts: snapshot.partCount,
  };

  panel.dispose();
  frame.dispose();
  initialMarker.dispose();
  marker.dispose();
  geometry.dispose();
  return result;
}
