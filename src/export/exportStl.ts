import { zipSync } from "fflate";
import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import type { PrintablePart } from "../parts/PrintablePart";
import {
  createMergedExportGeometry,
  createPartExportGeometry,
  type ExportSnapshot,
} from "./geometryUtils";

function makeSafeBaseName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .replace(/-+/g, "-")
    .slice(0, 48) || "model";
}

function geometryToBinaryStl(geometry: THREE.BufferGeometry) {
  const mesh = new THREE.Mesh(geometry);
  mesh.updateMatrixWorld(true);
  const data = new STLExporter().parse(mesh, { binary: true });
  return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadBinaryStl(snapshot: ExportSnapshot, modelName: string) {
  const geometry = createMergedExportGeometry(snapshot.parts);

  try {
    const data = geometryToBinaryStl(geometry);
    downloadBlob(new Blob([data], { type: "model/stl" }), `textgen3d-${makeSafeBaseName(modelName)}.stl`);
  } finally {
    geometry.dispose();
  }
}

function partToStl(part: PrintablePart) {
  const geometry = createPartExportGeometry(part);
  try {
    return geometryToBinaryStl(geometry);
  } finally {
    geometry.dispose();
  }
}

export function downloadPartsZip(snapshot: ExportSnapshot, modelName: string) {
  const archive = createPartsZipArchive(snapshot);
  downloadBlob(
    new Blob([archive], { type: "application/zip" }),
    `textgen3d-${makeSafeBaseName(modelName)}-parts.zip`,
  );
}

export function createPartsZipArchive(snapshot: ExportSnapshot) {
  const files: Record<string, Uint8Array> = {};
  snapshot.parts.filter((part) => part.enabled).forEach((part) => {
    files[`${part.fileName}.stl`] = partToStl(part);
  });
  return zipSync(files, { level: 6 });
}
