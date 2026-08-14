export type DraggableObjectKind =
  | "initialLetter"
  | "mainName"
  | "keychainText"
  | "ledText"
  | "decoration"
  | "extraText";

export type DraggableObject = {
  id: string;
  kind: DraggableObjectKind;
};

export type XYPosition = {
  x: number;
  y: number;
};

export type XYBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
