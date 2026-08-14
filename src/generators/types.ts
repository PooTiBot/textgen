export const GENERATORS = [
  { id: "nameplate", name: "Именная панель", description: "Табличка с большой буквой" },
  { id: "keychain", name: "Брелок", description: "Компактный брелок с именем" },
  { id: "led-sign", name: "LED-вывеска", description: "Полый световой короб с лицевой панелью" },
] as const;

export type GeneratorId = (typeof GENERATORS)[number]["id"];
