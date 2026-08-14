export type LedLetterMode = "separate" | "joined";

export type LedSignSettings = {
  text: string;
  fontId: string;
  textSize: number;
  letterSpacing: number;
  textX: number;
  textY: number;
  autoFit: boolean;
  maxWidth: number;
  maxHeight: number;
  letterMode: LedLetterMode;
  shellOffset: number;
  wallHeight: number;
  wallThickness: number;
  baseThickness: number;
  capThickness: number;
  capTolerance: number;
  capInset: number;
  capSeatEnabled: boolean;
  capSeatDepth: number;
  wireHoleEnabled: boolean;
  wireHoleDiameter: number;
  wireHoleX: number;
  wireHoleY: number;
  showBase: boolean;
  showWalls: boolean;
  showCaps: boolean;
  explodedView: number;
};

export const LED_LETTER_MODE_LABELS: Record<LedLetterMode, string> = {
  separate: "Отдельные буквы",
  joined: "Объединённое слово",
};
