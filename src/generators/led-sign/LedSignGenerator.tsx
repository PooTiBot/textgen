import { useCallback, useState } from "react";
import DecorationControls from "../../decorations/DecorationControls";
import type { DecorationItem } from "../../decorations/types";
import ExportControls from "../../export/ExportControls";
import type { ExportSnapshot } from "../../export/geometryUtils";
import LedSignControls from "./LedSignControls";
import LedSignScene from "./LedSignScene";
import {
  DEFAULT_LED_SIGN_SETTINGS,
  LED_SIGN_PRESETS,
  createLedSignPreset,
  type LedSignPresetId,
} from "./presets";
import type { LedSignSettings } from "./types";

let ledDecorationSequence = 0;

function createLedDecoration(index: number): DecorationItem {
  ledDecorationSequence += 1;
  return {
    id: `led-decoration-${Date.now()}-${ledDecorationSequence}`,
    type: index % 2 === 0 ? "star" : "heart",
    x: 70,
    y: index % 2 === 0 ? 22 : -22,
    z: 0,
    size: 18,
    depth: 3,
    rotation: 0,
    enabled: true,
  };
}

export default function LedSignGenerator() {
  const [settings, setSettings] = useState<LedSignSettings>(DEFAULT_LED_SIGN_SETTINGS);
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [activePreset, setActivePreset] = useState<LedSignPresetId | null>("glowing");
  const [exportSnapshot, setExportSnapshot] = useState<ExportSnapshot | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [effectiveTextSize, setEffectiveTextSize] = useState<number | null>(null);

  const updateSettings = (patch: Partial<LedSignSettings>) => {
    setActivePreset(null);
    setSettings((current) => ({ ...current, ...patch }));
  };
  const applyPreset = (presetId: LedSignPresetId) => {
    setSettings(createLedSignPreset(presetId));
    setDecorations([]);
    setActivePreset(presetId);
  };
  const addDecoration = () => {
    const item = createLedDecoration(decorations.length);
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
  const handleTextPositionChange = useCallback((x: number, y: number) => {
    setSettings((current) => ({ ...current, textX: x, textY: y }));
  }, []);
  const handleDecorationPositionChange = useCallback((id: string, x: number, y: number) => {
    setDecorations((current) => current.map((item) => (
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
        <section className="keychain-presets" aria-labelledby="led-presets-title">
          <span className="panel-controls-kicker">Quick start</span>
          <h2 id="led-presets-title">Пресеты LED-вывески</h2>
          <div className="led-preset-grid">
            {LED_SIGN_PRESETS.map((preset) => (
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
          <p>Пресет задаёт конструкцию, после чего все размеры остаются редактируемыми.</p>
        </section>

        <LedSignControls
          settings={settings}
          effectiveTextSize={effectiveTextSize}
          onChange={updateSettings}
        />

        <DecorationControls
          items={decorations}
          onAdd={addDecoration}
          onUpdate={updateDecoration}
          onRemove={removeDecoration}
        />

        <ExportControls
          modelName={settings.text.trim() || "model"}
          snapshot={exportSnapshot}
          fileNamePrefix="textgen3d-led-sign"
        />

        {fontError && <div className="font-error">{fontError}</div>}
        <div className="hint">
          Основание, полые стенки и крышки экспортируются как отдельные печатные детали. Разнесение меняет только preview.
        </div>
      </aside>

      <section className="viewport">
        <LedSignScene
          settings={settings}
          decorations={decorations}
          onTextPositionChange={handleTextPositionChange}
          onDecorationPositionChange={handleDecorationPositionChange}
          onFontError={handleFontError}
          onExportSnapshotChange={handleExportSnapshotChange}
          onEffectiveTextSizeChange={setEffectiveTextSize}
        />
      </section>
    </main>
  );
}
