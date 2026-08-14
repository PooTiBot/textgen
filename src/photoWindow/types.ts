export type PhotoWindowShape = "rectangle" | "rounded-rectangle" | "oval";
export type PhotoWindowMode = "cutout" | "recess" | "frame-only";

export type PhotoWindowSettings = {
  enabled: boolean;
  shape: PhotoWindowShape;
  width: number;
  height: number;
  x: number;
  y: number;
  depth: number;
  mode: PhotoWindowMode;
  recessDepth: number;
  padding: number;
  cornerRadius: number;
  innerFrameEnabled: boolean;
  innerFrameWidth: number;
  innerFrameDepth: number;
  innerFrameOffsetZ: number;
};

export const DEFAULT_PHOTO_WINDOW_SETTINGS: PhotoWindowSettings = {
  enabled: false,
  shape: "rounded-rectangle",
  width: 90,
  height: 65,
  x: 85,
  y: 0,
  depth: 2,
  mode: "recess",
  recessDepth: 1.2,
  padding: 2,
  cornerRadius: 8,
  innerFrameEnabled: true,
  innerFrameWidth: 4,
  innerFrameDepth: 2,
  innerFrameOffsetZ: 0,
};

export const PHOTO_WINDOW_SHAPE_LABELS: Record<PhotoWindowShape, string> = {
  rectangle: "Прямоугольник",
  "rounded-rectangle": "Скруглённый прямоугольник",
  oval: "Овал",
};

export const PHOTO_WINDOW_MODE_LABELS: Record<PhotoWindowMode, string> = {
  cutout: "Сквозное окно",
  recess: "Углубление",
  "frame-only": "Только рамка",
};
