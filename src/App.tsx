import { useCallback, useMemo, useState } from "react";
import "./index.css";
import FontPicker from "./components/FontPicker";
import RangeNumberControl from "./components/RangeNumberControl";
import Scene from "./components/Scene";
import DecorationControls from "./decorations/DecorationControls";
import { DECORATION_TYPES, type DecorationItem } from "./decorations/types";
import ExportControls from "./export/ExportControls";
import type { ExportSnapshot } from "./export/geometryUtils";
import PanelControls from "./panel/PanelControls";
import type { PanelShape } from "./panel/types";
import ExtraTextControls from "./textItems/ExtraTextControls";
import type { ExtraTextItem } from "./textItems/types";
import PocketControls from "./tolerance/PocketControls";
import {
  DEFAULT_BIG_LETTER_FONT_ID,
  DEFAULT_NAME_FONT_ID,
  getCatalogFont,
} from "./fonts/fontCatalog";

let itemSequence = 0;

function createItemId(prefix: string) {
  itemSequence += 1;
  return `${prefix}-${Date.now()}-${itemSequence}`;
}

function createDefaultDecoration(index: number): DecorationItem {
  const positions = [
    { x: -105, y: -70 },
    { x: 105, y: -70 },
    { x: -115, y: 70 },
    { x: 115, y: 70 },
    { x: -150, y: 0 },
    { x: 150, y: 0 },
  ];
  const position = positions[index % positions.length];

  return {
    id: createItemId("decoration"),
    type: DECORATION_TYPES[index % DECORATION_TYPES.length],
    x: position.x,
    y: position.y,
    z: 1,
    size: 34,
    depth: 6,
    rotation: 0,
    enabled: true,
  };
}

function createDefaultExtraText(index: number): ExtraTextItem {
  const examples = ["50 см", "3200 г", "12.03.2026", "08:45"];

  return {
    id: createItemId("extra-text"),
    text: examples[index % examples.length],
    fontId: DEFAULT_NAME_FONT_ID,
    x: 65,
    y: -72 - index * 30,
    z: 1,
    size: 22,
    depth: 5,
    rotation: 0,
    enabled: true,
  };
}

function App() {
  const [text, setText] = useState("Пример");
  const [depth, setDepth] = useState(12);
  const [initialSize, setInitialSize] = useState(150);
  const [nameSize, setNameSize] = useState(52);
  const [initialFontId, setInitialFontId] = useState(DEFAULT_BIG_LETTER_FONT_ID);
  const [nameFontId, setNameFontId] = useState(DEFAULT_NAME_FONT_ID);
  const [initialOffsetX, setInitialOffsetX] = useState(0);
  const [initialOffsetY, setInitialOffsetY] = useState(0);
  const [nameOffsetX, setNameOffsetX] = useState(0);
  const [nameOffsetY, setNameOffsetY] = useState(0);
  const [panelEnabled, setPanelEnabled] = useState(true);
  const [panelShape, setPanelShape] = useState<PanelShape>("rounded-rectangle");
  const [panelAutoSize, setPanelAutoSize] = useState(true);
  const [panelWidth, setPanelWidth] = useState(320);
  const [panelHeight, setPanelHeight] = useState(160);
  const [panelThickness, setPanelThickness] = useState(8);
  const [panelPadding, setPanelPadding] = useState(22);
  const [panelOffsetZ, setPanelOffsetZ] = useState(2);
  const [frameEnabled, setFrameEnabled] = useState(false);
  const [frameWidth, setFrameWidth] = useState(5);
  const [frameDepth, setFrameDepth] = useState(3);
  const [frameOffsetZ, setFrameOffsetZ] = useState(0);
  const [namePocketEnabled, setNamePocketEnabled] = useState(false);
  const [nameTolerance, setNameTolerance] = useState(0.2);
  const [namePocketDepth, setNamePocketDepth] = useState(2);
  const [showMainName, setShowMainName] = useState(true);
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [extraTextItems, setExtraTextItems] = useState<ExtraTextItem[]>([]);
  const [exportSnapshot, setExportSnapshot] = useState<ExportSnapshot | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const handleFontError = useCallback((message: string | null) => {
    setFontError(message);
  }, []);
  const handleExportSnapshotChange = useCallback((snapshot: ExportSnapshot | null) => {
    setExportSnapshot(snapshot);
  }, []);
  const cleanText = text.trim() || "А";
  const initialPreview = Array.from(cleanText)[0].toLocaleUpperCase("ru-RU");
  const initialFont = getCatalogFont(initialFontId);
  const nameFont = getCatalogFont(nameFontId);
  const addDecoration = () => {
    const item = createDefaultDecoration(decorations.length);
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
    const item = createDefaultExtraText(extraTextItems.length);
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
  const handleDepthChange = (nextDepth: number) => {
    setDepth(nextDepth);
    setNamePocketDepth((current) => Math.min(current, nextDepth));
  };
  const panelSettings = useMemo(() => ({
    enabled: panelEnabled,
    shape: panelShape,
    autoSize: panelAutoSize,
    width: panelWidth,
    height: panelHeight,
    thickness: panelThickness,
    padding: panelPadding,
    offsetZ: panelOffsetZ,
    frameEnabled,
    frameWidth,
    frameDepth,
    frameOffsetZ,
  }), [
    panelEnabled,
    panelShape,
    panelAutoSize,
    panelWidth,
    panelHeight,
    panelThickness,
    panelPadding,
    panelOffsetZ,
    frameEnabled,
    frameWidth,
    frameDepth,
    frameOffsetZ,
  ]);
  const pocketSettings = useMemo(() => ({
    enabled: namePocketEnabled,
    tolerance: nameTolerance,
    depth: namePocketDepth,
  }), [namePocketEnabled, nameTolerance, namePocketDepth]);

  return (
    <div className="app">
      <header className="header">
        <h1>TextGen3D</h1>
        <span>Генератор 3D-имён с кириллицей</span>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <h2>Имя</h2>
          <label>
            Текст
            <input
              type="text"
              value={text}
              maxLength={24}
              onChange={(e) => setText(e.target.value)}
              placeholder="Например: Сергей"
            />
          </label>

          <label>
            Толщина: <b>{depth} мм</b>
            <input
              type="range"
              min="4"
              max="30"
              step="1"
              value={depth}
              onChange={(e) => handleDepthChange(Number(e.target.value))}
            />
          </label>

          <FontPicker
            label="Шрифт большой буквы"
            value={initialFontId}
            previewText={initialPreview}
            mode="bigLetter"
            onChange={setInitialFontId}
          />

          <FontPicker
            label="Шрифт имени"
            value={nameFontId}
            previewText={cleanText}
            mode="name"
            onChange={setNameFontId}
          />

          <RangeNumberControl
            id="initial-size"
            label="Размер большой буквы"
            value={initialSize}
            min={40}
            max={250}
            step={5}
            onChange={setInitialSize}
          />

          <RangeNumberControl
            id="name-size"
            label="Размер полного имени"
            value={nameSize}
            min={20}
            max={140}
            step={2}
            onChange={setNameSize}
          />

          <RangeNumberControl
            id="initial-offset-x"
            label="Смещение большой буквы по X"
            value={initialOffsetX}
            min={-100}
            max={100}
            onChange={setInitialOffsetX}
          />

          <RangeNumberControl
            id="initial-offset-y"
            label="Смещение большой буквы по Y"
            value={initialOffsetY}
            min={-100}
            max={100}
            onChange={setInitialOffsetY}
          />

          <RangeNumberControl
            id="name-offset-x"
            label="Смещение полного имени по X"
            value={nameOffsetX}
            min={-150}
            max={150}
            onChange={setNameOffsetX}
          />

          <RangeNumberControl
            id="name-offset-y"
            label="Смещение полного имени по Y"
            value={nameOffsetY}
            min={-150}
            max={150}
            onChange={setNameOffsetY}
          />

          <PocketControls
            enabled={namePocketEnabled}
            tolerance={nameTolerance}
            pocketDepth={namePocketDepth}
            initialDepth={depth}
            showMainName={showMainName}
            onEnabledChange={setNamePocketEnabled}
            onToleranceChange={setNameTolerance}
            onPocketDepthChange={setNamePocketDepth}
            onShowMainNameChange={setShowMainName}
          />

          <PanelControls
            enabled={panelEnabled}
            shape={panelShape}
            autoSize={panelAutoSize}
            width={panelWidth}
            height={panelHeight}
            thickness={panelThickness}
            padding={panelPadding}
            offsetZ={panelOffsetZ}
            frameEnabled={frameEnabled}
            frameWidth={frameWidth}
            frameDepth={frameDepth}
            frameOffsetZ={frameOffsetZ}
            onEnabledChange={setPanelEnabled}
            onShapeChange={setPanelShape}
            onAutoSizeChange={setPanelAutoSize}
            onWidthChange={setPanelWidth}
            onHeightChange={setPanelHeight}
            onThicknessChange={setPanelThickness}
            onPaddingChange={setPanelPadding}
            onOffsetZChange={setPanelOffsetZ}
            onFrameEnabledChange={setFrameEnabled}
            onFrameWidthChange={setFrameWidth}
            onFrameDepthChange={setFrameDepth}
            onFrameOffsetZChange={setFrameOffsetZ}
          />

          <DecorationControls
            items={decorations}
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

          <ExportControls modelName={cleanText} snapshot={exportSnapshot} />

          {fontError && <div className="font-error">{fontError}</div>}

          <div className="hint">
            Первая буква — крупная, полное имя — поверх неё. Можно крутить модель мышкой и приближать колёсиком.
          </div>
        </aside>

        <section className="viewport">
          <Scene
            text={cleanText}
            depth={depth}
            initialFont={initialFont}
            nameFont={nameFont}
            initialSize={initialSize}
            nameSize={nameSize}
            initialOffsetX={initialOffsetX}
            initialOffsetY={initialOffsetY}
            nameOffsetX={nameOffsetX}
            nameOffsetY={nameOffsetY}
            panelSettings={panelSettings}
            decorations={decorations}
            extraTextItems={extraTextItems}
            pocketSettings={pocketSettings}
            showMainName={showMainName}
            onFontError={handleFontError}
            onExportSnapshotChange={handleExportSnapshotChange}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
