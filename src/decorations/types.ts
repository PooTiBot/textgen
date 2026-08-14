export const DECORATION_TYPES = [
    "star",
    "heart",
    "butterfly",
    "cloud",
    "moon",
    "crown",
] as const;

export type DecorationType = (typeof DECORATION_TYPES)[number];

export type DecorationItem = {
    id: string;
    type: DecorationType;
    x: number;
    y: number;
    z: number;
    size: number;
    depth: number;
    rotation: number;
    enabled: boolean;
};

export const DECORATION_TYPE_LABELS: Record<DecorationType, string> = {
    star: "Звезда",
    heart: "Сердце",
    butterfly: "Бабочка",
    cloud: "Облако",
    moon: "Луна",
    crown: "Корона",
};
