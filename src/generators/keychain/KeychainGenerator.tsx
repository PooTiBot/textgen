import { useCallback, useMemo, useState } from "react";
import DecorationControls from "../../decorations/DecorationControls";
import type { DecorationItem } from "../../decorations/types";
import ExportControls from "../../export/ExportControls";
import type { ExportSnapshot } from "../../export/geometryUtils";
import { DEFAULT_NAME_FONT_ID } from "../../fonts/fontCatalog";
import ExtraTextControls from "../../textItems/ExtraTextControls";
import type { ExtraTextItem } from "../../textItems/types";
import KeychainControls from "./KeychainControls";
import KeychainScene from "./KeychainScene";
import { getKeychainMountWarning } from "./geometry";
import {
  DEFAULT_KEYCHAIN_SETTINGS,
  KEYCHAIN_PRESETS,
  createKeychainPreset,
  type KeychainPresetId,
} from "./presets";
import type { KeychainSettings } from "./types";

let keychainItemSequence = 0;

function createDecoration(index: number): DecorationItem {
  keychainItemSequence += 1;
  return {
    id: `keychain-decoration-${Date.now()}-${keychainItemSequence}`,
    type: index % 2 === 0 ? "star" : "heart",
    x: 22,
    y: index % 2 === 0 ? 6 : -6,
    z: 0,
    size: 6,
    depth: 1.2,
    rotation: 0,
    enabled: true,
  };
}

function createExtraText(index: number): ExtraTextItem {
  keychainItemSequence += 1;
  const examples = ["тел. 8 900 000-00-00", "Мой ключ", "2026"];
  return {
    id: `keychain-extra-text-${Date.now()}-${keychainItemSequence}`,
    text: examples[index % examples.length],
    fontId: DEFAULT_NAME_FONT_ID,
    x: 8,
    y: -7 - index * 7,
    z: 0,
    size: 8,
    depth: 1.2,
    rotation: 0,
    enabled: true,
  };
}

export default function KeychainGenerator() {
  const [settings, setSettings] = useState<KeychainSettings>(DEFAULT_KEYCHAIN_SETTINGS);
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [extraTextItems, setExtraTextItems] = useState<ExtraTextItem[]>([]);
  const [activePreset, setActivePreset] = useState<KeychainPresetId | null>("classic");
  const [exportSnapshot, setExportSnapshot] = useState<ExportSnapshot | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [effectiveTextSize, setEffectiveTextSize] = useState<number | null>(null);
  const mountWarning = useMemo(() => getKeychainMountWarning(settings), [settings]);

  const updateSettings = (patch: Partial<KeychainSettings>) => {
    setActivePreset(null);
    setSettings((current) => ({ ...current, ...patch }));
  };
  const applyPreset = (presetId: KeychainPresetId) => {
    const preset = createKeychainPreset(presetId);
    setSettings(preset.settings);
    setDecorations(preset.decorations);
    setExtraTextItems([]);
    setActivePreset(presetId);
  };
  const addDecoration = () => {
    const item = createDecoration(decorations.length);
    setDecorations((current) => [...current, item]);
    return item.id;
  };
  const updateDecoration = (id: string, patch: Partial<DecorationItem>) => {
    setDecorations((current) => current.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )));
  };
  const removeDecoration = (id: string) => {
    setDecorations((current) => current.filter((item) => item.id !== id));
  };
  const addExtraText = () => {
    const item = createExtraText(extraTextItems.length);
    setExtraTextItems((current) => [...current, item]);
    return item.id;
  };
  const updateExtraText = (id: string, patch: Partial<ExtraTextItem>) => {
    setExtraTextItems((current) => current.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )));
  };
  const removeExtraText = (id: string) => {
    setExtraTextItems((current) => current.filter((item) => item.id !== id));
  };
  const handleTextPositionChange = useCallback((x: number, y: number) => {
    setSettings((current) => ({ ...current, textX: x, textY: y }));
  }, []);
  const handleDecorationPositionChange = useCallback((id: string, x: number, y: number) => {
    setDecorations((current) => current.map((item) => (
      item.id === id ? { ...item, x, y } : item
    )));
  }, []);
  const handleExtraTextPositionChange = useCallback((id: string, x: number, y: number) => {
    setExtraTextItems((current) => current.map((item) => (
      item.id === id ? { ...item, x, y } : item
    )));
  }, []);
  const handleFontError = useCallback((message: string | null) => setFontError(message), []);
  const handleExportSnapshotChange = useCallback(
    (snapshot: ExportSnapshot | null) => setExportSnapshot(snapshot),
    [],
  );

  return (
    <main className="workspace">
      <aside className="sidebar">
        <section className="keychain-presets" aria-labelledby="keychain-presets-title">
          <span className="panel-controls-kicker">Quick start</span>
          <h2 id="keychain-presets-title">Пресеты брелока</h2>
          <div className="keychain-preset-grid">
            {KEYCHAIN_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={activePreset === preset.id ? "is-active" : ""}
                aria-pressed={activePreset === preset.id}
                onClick={() => applyPreset(preset.id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <p>Пресет задаёт стартовые параметры — после выбора всё можно менять.</p>
        </section>

        <KeychainControls
          settings={settings}
          mountWarning={mountWarning}
          effectiveTextSize={effectiveTextSize}
          onChange={updateSettings}
        />

        <DecorationControls
          items={decorations}
          compact
          onAdd={addDecoration}
          onUpdate={updateDecoration}
          onRemove={removeDecoration}
        />

        <ExtraTextControls
          items={extraTextItems}
          onAdd={addExtraText}
          onUpdate={updateExtraText}
          onRemove={removeExtraText}
        />

        <ExportControls
          modelName={settings.text.trim() || "model"}
          snapshot={exportSnapshot}
          fileNamePrefix="textgen3d-keychain"
        />

        {fontError && <div className="font-error">{fontError}</div>}
        <div className="hint">
          Текст и декор можно перетаскивать прямо по модели. Размеры STL остаются в миллиметрах независимо от масштаба preview.
        </div>
      </aside>

      <section className="viewport">
        <KeychainScene
          settings={settings}
          decorations={decorations}
          extraTextItems={extraTextItems}
          onTextPositionChange={handleTextPositionChange}
          onDecorationPositionChange={handleDecorationPositionChange}
          onExtraTextPositionChange={handleExtraTextPositionChange}
          onFontError={handleFontError}
          onExportSnapshotChange={handleExportSnapshotChange}
          onEffectiveTextSizeChange={setEffectiveTextSize}
        />
      </section>
    </main>
  );
}
