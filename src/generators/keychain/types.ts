export const KEYCHAIN_SHAPES = ["capsule", "rounded-rectangle", "oval"] as const;
export type KeychainShape = (typeof KEYCHAIN_SHAPES)[number];

export const KEYCHAIN_TEXT_MODES = ["raised", "inlay"] as const;
export type KeychainTextMode = (typeof KEYCHAIN_TEXT_MODES)[number];

export const KEYCHAIN_MOUNT_TYPES = ["hole", "loop"] as const;
export type KeychainMountType = (typeof KEYCHAIN_MOUNT_TYPES)[number];

export type KeychainLoopSide = "left" | "right";

export type KeychainSettings = {
  shape: KeychainShape;
  width: number;
  height: number;
  thickness: number;
  cornerRadius: number;
  text: string;
  fontId: string;
  textSize: number;
  textDepth: number;
  textX: number;
  textY: number;
  textMode: KeychainTextMode;
  tolerance: number;
  pocketDepth: number;
  autoFit: boolean;
  padding: number;
  mountType: KeychainMountType;
  holeEnabled: boolean;
  holeDiameter: number;
  holeX: number;
  holeY: number;
  loopOuterDiameter: number;
  loopInnerDiameter: number;
  loopSide: KeychainLoopSide;
};

export const KEYCHAIN_SHAPE_LABELS: Record<KeychainShape, string> = {
  capsule: "Капсула",
  "rounded-rectangle": "Скруглённый прямоугольник",
  oval: "Овал",
};

export const KEYCHAIN_TEXT_MODE_LABELS: Record<KeychainTextMode, string> = {
  raised: "Выпуклый текст",
  inlay: "Вставка с вырезом",
};

export const KEYCHAIN_MOUNT_TYPE_LABELS: Record<KeychainMountType, string> = {
  hole: "Отверстие",
  loop: "Внешнее ушко",
};
