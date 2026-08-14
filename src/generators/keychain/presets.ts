import type { DecorationItem } from "../../decorations/types";
import { DEFAULT_NAME_FONT_ID } from "../../fonts/fontCatalog";
import type { KeychainSettings } from "./types";

export type KeychainPresetId = "classic" | "inlay" | "children";

export const KEYCHAIN_PRESETS: readonly { id: KeychainPresetId; name: string }[] = [
  { id: "classic", name: "Классический" },
  { id: "inlay", name: "Вставка" },
  { id: "children", name: "Детский" },
];

export const DEFAULT_KEYCHAIN_SETTINGS: KeychainSettings = {
  shape: "rounded-rectangle",
  width: 70,
  height: 25,
  thickness: 3,
  cornerRadius: 5,
  text: "Пример",
  fontId: DEFAULT_NAME_FONT_ID,
  textSize: 15,
  textDepth: 1.4,
  textX: 4,
  textY: 0,
  textMode: "raised",
  tolerance: 0.2,
  pocketDepth: 1.2,
  autoFit: true,
  padding: 3,
  mountType: "hole",
  holeEnabled: true,
  holeDiameter: 5,
  holeX: -28.5,
  holeY: 0,
  loopOuterDiameter: 10,
  loopInnerDiameter: 5,
  loopSide: "left",
};

function presetDecoration(
  id: string,
  type: DecorationItem["type"],
  x: number,
  y: number,
): DecorationItem {
  return {
    id,
    type,
    x,
    y,
    z: 0,
    size: 6,
    depth: 1.2,
    rotation: 0,
    enabled: true,
  };
}

export function createKeychainPreset(preset: KeychainPresetId) {
  const common: KeychainSettings = { ...DEFAULT_KEYCHAIN_SETTINGS };

  if (preset === "inlay") {
    return {
      settings: {
        ...common,
        textMode: "inlay" as const,
        tolerance: 0.2,
        pocketDepth: 1.2,
        textDepth: 1.4,
      },
      decorations: [] as DecorationItem[],
    };
  }

  if (preset === "children") {
    return {
      settings: {
        ...common,
        shape: "capsule" as const,
        fontId: "comfortaa",
        mountType: "loop" as const,
        loopSide: "left" as const,
        textX: -4,
        textSize: 11,
      },
      decorations: [
        { ...presetDecoration("preset-star", "star", 24, 6), size: 5.5 },
        { ...presetDecoration("preset-heart", "heart", 24, -6), size: 5.5 },
      ],
    };
  }

  return { settings: common, decorations: [] as DecorationItem[] };
}
