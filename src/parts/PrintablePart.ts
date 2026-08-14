import type * as THREE from "three";

export type PrintablePartType =
  | "backPanel"
  | "panelFrame"
  | "initialLetter"
  | "mainName"
  | "decoration"
  | "extraText";

export type PrintablePart = {
  id: string;
  type: PrintablePartType;
  name: string;
  fileName: string;
  geometry: THREE.BufferGeometry;
  matrix: THREE.Matrix4;
  enabled: boolean;
  previewVisible: boolean;
};
