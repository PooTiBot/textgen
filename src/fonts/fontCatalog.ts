export type FontCategory =
  | "Массивные"
  | "Техно"
  | "Геометрические"
  | "Округлые"
  | "Узкие"
  | "Рукописные"
  | "Каллиграфические"
  | "Детские"
  | "Декоративные"
  | "Классические";

export type FontPrintability = "good" | "medium" | "thin";

export type CatalogFont = {
  id: string;
  name: string;
  file: string;
  categories: readonly [FontCategory, ...FontCategory[]];
  recommendedForBigLetter: boolean;
  recommendedForName: boolean;
  printability: FontPrintability;
};

export const FONT_CATEGORIES: readonly FontCategory[] = [
  "Массивные",
  "Техно",
  "Геометрические",
  "Округлые",
  "Узкие",
  "Рукописные",
  "Каллиграфические",
  "Детские",
  "Декоративные",
  "Классические",
];

export const FONT_CATALOG: readonly CatalogFont[] = [
  {
    id: "russo-one",
    name: "Russo One",
    file: "/fonts/catalog/russo-one/RussoOne-Regular.ttf",
    categories: ["Техно", "Массивные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "rubik-mono-one",
    name: "Rubik Mono One",
    file: "/fonts/catalog/rubik-mono-one/RubikMonoOne-Regular.ttf",
    categories: ["Массивные", "Геометрические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "comfortaa",
    name: "Comfortaa",
    file: "/fonts/catalog/comfortaa/Comfortaa-Variable.ttf",
    categories: ["Округлые", "Геометрические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "pt-sans-narrow",
    name: "PT Sans Narrow",
    file: "/fonts/catalog/pt-sans-narrow/PTSansNarrow-Regular.ttf",
    categories: ["Узкие"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "old-standard-tt",
    name: "Old Standard TT",
    file: "/fonts/catalog/old-standard-tt/OldStandard-Regular.ttf",
    categories: ["Классические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "eb-garamond",
    name: "EB Garamond",
    file: "/fonts/catalog/eb-garamond/EBGaramond-Variable.ttf",
    categories: ["Классические"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
  {
    id: "oswald",
    name: "Oswald",
    file: "/fonts/catalog/oswald/Oswald-Variable.ttf",
    categories: ["Узкие", "Массивные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "unbounded",
    name: "Unbounded",
    file: "/fonts/catalog/unbounded/Unbounded-Variable.ttf",
    categories: ["Геометрические", "Техно"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "caveat",
    name: "Caveat",
    file: "/fonts/catalog/caveat/Caveat-Variable.ttf",
    categories: ["Рукописные"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "thin",
  },
  {
    id: "jura",
    name: "Jura",
    file: "/fonts/catalog/jura/Jura-Variable.ttf",
    categories: ["Техно", "Геометрические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "play",
    name: "Play",
    file: "/fonts/catalog/play/Play-Regular.ttf",
    categories: ["Техно"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "poiret-one",
    name: "Poiret One",
    file: "/fonts/catalog/poiret-one/PoiretOne-Regular.ttf",
    categories: ["Округлые", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    file: "/fonts/catalog/cormorant-garamond/CormorantGaramond-Variable.ttf",
    categories: ["Классические"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
  {
    id: "lobster",
    name: "Lobster",
    file: "/fonts/catalog/lobster/Lobster-Regular.ttf",
    categories: ["Каллиграфические", "Рукописные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "neucha",
    name: "Neucha",
    file: "/fonts/catalog/neucha/Neucha-Regular.ttf",
    categories: ["Рукописные", "Детские"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "thin",
  },
  {
    id: "yeseva-one",
    name: "Yeseva One",
    file: "/fonts/catalog/yeseva-one/YesevaOne-Regular.ttf",
    categories: ["Классические", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "stalinist-one",
    name: "Stalinist One",
    file: "/fonts/catalog/stalinist-one/StalinistOne-Regular.ttf",
    categories: ["Массивные", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "good",
  },
  {
    id: "marck-script",
    name: "Marck Script",
    file: "/fonts/catalog/marck-script/MarckScript-Regular.ttf",
    categories: ["Каллиграфические", "Рукописные"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "thin",
  },
  {
    id: "pacifico",
    name: "Pacifico",
    file: "/fonts/catalog/pacifico/Pacifico-Regular.ttf",
    categories: ["Каллиграфические", "Рукописные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "amatic-sc",
    name: "Amatic SC",
    file: "/fonts/catalog/amaticsc/AmaticSC-Regular.ttf",
    categories: ["Детские", "Узкие"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "thin",
  },
  {
    id: "bad-script",
    name: "Bad Script",
    file: "/fonts/catalog/badscript/BadScript-Regular.ttf",
    categories: ["Рукописные", "Каллиграфические"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "thin",
  },
  {
    id: "comforter-brush",
    name: "Comforter Brush",
    file: "/fonts/catalog/comforterbrush/ComforterBrush-Regular.ttf",
    categories: ["Каллиграфические", "Рукописные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
  {
    id: "pattaya",
    name: "Pattaya",
    file: "/fonts/catalog/pattaya/Pattaya-Regular.ttf",
    categories: ["Каллиграфические", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "shantell-sans",
    name: "Shantell Sans",
    file: "/fonts/catalog/shantellsans/ShantellSans-Variable.ttf",
    categories: ["Рукописные", "Детские"],
    recommendedForBigLetter: false,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "pangolin",
    name: "Pangolin",
    file: "/fonts/catalog/pangolin/Pangolin-Regular.ttf",
    categories: ["Детские", "Рукописные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "balsamiq-sans",
    name: "Balsamiq Sans",
    file: "/fonts/catalog/balsamiqsans/BalsamiqSans-Regular.ttf",
    categories: ["Детские", "Округлые"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "underdog",
    name: "Underdog",
    file: "/fonts/catalog/underdog/Underdog-Regular.ttf",
    categories: ["Детские", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "rubik-bubbles",
    name: "Rubik Bubbles",
    file: "/fonts/catalog/rubikbubbles/RubikBubbles-Regular.ttf",
    categories: ["Детские", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "rubik-moonrocks",
    name: "Rubik Moonrocks",
    file: "/fonts/catalog/rubikmoonrocks/RubikMoonrocks-Regular.ttf",
    categories: ["Декоративные", "Техно"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "medium",
  },
  {
    id: "rubik-beastly",
    name: "Rubik Beastly",
    file: "/fonts/catalog/rubikbeastly/RubikBeastly-Regular.ttf",
    categories: ["Декоративные", "Детские"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
  {
    id: "ruslan-display",
    name: "Ruslan Display",
    file: "/fonts/catalog/ruslandisplay/RuslanDisplay-Regular.ttf",
    categories: ["Декоративные", "Классические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "good",
  },
  {
    id: "press-start-2p",
    name: "Press Start 2P",
    file: "/fonts/catalog/pressstart2p/PressStart2P-Regular.ttf",
    categories: ["Техно", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "good",
  },
  {
    id: "kelly-slab",
    name: "Kelly Slab",
    file: "/fonts/catalog/kellyslab/KellySlab-Regular.ttf",
    categories: ["Техно", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "oi",
    name: "Oi",
    file: "/fonts/catalog/oi/Oi-Regular.ttf",
    categories: ["Массивные", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "good",
  },
  {
    id: "alice",
    name: "Alice",
    file: "/fonts/catalog/alice/Alice-Regular.ttf",
    categories: ["Классические", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "lora",
    name: "Lora",
    file: "/fonts/catalog/lora/Lora-Variable.ttf",
    categories: ["Классические"],
    recommendedForBigLetter: true,
    recommendedForName: true,
    printability: "medium",
  },
  {
    id: "prata",
    name: "Prata",
    file: "/fonts/catalog/prata/Prata-Regular.ttf",
    categories: ["Классические", "Декоративные"],
    recommendedForBigLetter: true,
    recommendedForName: false,
    printability: "thin",
  },
];

export const DEFAULT_BIG_LETTER_FONT_ID = "russo-one";
export const DEFAULT_NAME_FONT_ID = "russo-one";

export function getCatalogFont(fontId: string) {
  return FONT_CATALOG.find((font) => font.id === fontId) ?? FONT_CATALOG[0];
}

export function getCatalogFontFamily(fontId: string) {
  return `TextGenCatalog-${fontId}`;
}

export function registerCatalogFontFaces() {
  if (typeof document === "undefined" || document.getElementById("textgen-font-catalog")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "textgen-font-catalog";
  style.textContent = FONT_CATALOG.map(
    (font) => `
      @font-face {
        font-family: "${getCatalogFontFamily(font.id)}";
        src: url("${font.file}") format("truetype");
        font-style: normal;
        font-weight: 400;
        font-display: swap;
      }
    `,
  ).join("\n");

  document.head.append(style);
}
