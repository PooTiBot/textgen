export type PanelShape =
  | "rectangle"
  | "rounded-rectangle"
  | "oval"
  | "cloud"
  | "plaque"
  | "arch"
  | "hexagon";

export type PanelSettings = {
  enabled: boolean;
  shape: PanelShape;
  autoSize: boolean;
  width: number;
  height: number;
  thickness: number;
  padding: number;
  offsetZ: number;
  frameEnabled: boolean;
  frameWidth: number;
  frameDepth: number;
  frameOffsetZ: number;
};

export const PANEL_SHAPE_LABELS: Record<PanelShape, string> = {
  rectangle: "Прямоугольник",
  "rounded-rectangle": "Скруглённый прямоугольник",
  oval: "Овал",
  cloud: "Облако",
  plaque: "Фигурная табличка",
  arch: "Арка",
  hexagon: "Шестиугольник",
};
