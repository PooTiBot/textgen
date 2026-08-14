import { DEFAULT_NAME_FONT_ID } from "../../fonts/fontCatalog";
import type { LedSignSettings } from "./types";

export type LedSignPresetId = "glowing" | "inlay" | "volume";

export const LED_SIGN_PRESETS: readonly { id: LedSignPresetId; name: string }[] = [
  { id: "glowing", name: "Классические буквы" },
  { id: "inlay", name: "Объединённое слово" },
  { id: "volume", name: "Для тонкого шрифта" },
];

export const DEFAULT_LED_SIGN_SETTINGS: LedSignSettings = {
  text: "Пример",
  fontId: DEFAULT_NAME_FONT_ID,
  textSize: 70,
  letterSpacing: 2,
  textX: 0,
  textY: 0,
  autoFit: true,
  maxWidth: 240,
  maxHeight: 100,
  letterMode: "separate",
  shellOffset: 2,
  wallHeight: 15,
  wallThickness: 1.6,
  baseThickness: 2,
  capThickness: 1,
  capTolerance: 0.2,
  capInset: 0,
  capSeatEnabled: true,
  capSeatDepth: 1.2,
  wireHoleEnabled: true,
  wireHoleDiameter: 5,
  wireHoleX: 0,
  wireHoleY: 0,
  showBase: true,
  showWalls: true,
  showCaps: true,
  explodedView: 0,
};

export function createLedSignPreset(preset: LedSignPresetId): LedSignSettings {
  if (preset === "inlay") {
    return {
      ...DEFAULT_LED_SIGN_SETTINGS,
      letterMode: "joined",
      shellOffset: 3,
      letterSpacing: 0,
      fontId: "comfortaa",
    };
  }
  if (preset === "volume") {
    return {
      ...DEFAULT_LED_SIGN_SETTINGS,
      shellOffset: 5,
      wallThickness: 2,
      fontId: "pacifico",
    };
  }
  return { ...DEFAULT_LED_SIGN_SETTINGS };
}
