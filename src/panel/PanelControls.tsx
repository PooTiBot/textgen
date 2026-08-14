import RangeNumberControl from "../components/RangeNumberControl";
import { PANEL_SHAPE_LABELS, type PanelShape } from "./types";

type Props = {
  enabled: boolean;
  shape: PanelShape;
  autoSize: boolean;
  width: number;
  height: number;
  thickness: number;
  padding: number;
  offsetZ: number;
  frameEnabled: boolean;
  frameWidth: number;
  frameDepth: number;
  frameOffsetZ: number;
  onEnabledChange: (enabled: boolean) => void;
  onShapeChange: (shape: PanelShape) => void;
  onAutoSizeChange: (autoSize: boolean) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onThicknessChange: (thickness: number) => void;
  onPaddingChange: (padding: number) => void;
  onOffsetZChange: (offsetZ: number) => void;
  onFrameEnabledChange: (enabled: boolean) => void;
  onFrameWidthChange: (width: number) => void;
  onFrameDepthChange: (depth: number) => void;
  onFrameOffsetZChange: (offsetZ: number) => void;
};

export default function PanelControls({
  enabled,
  shape,
  autoSize,
  width,
  height,
  thickness,
  padding,
  offsetZ,
  frameEnabled,
  frameWidth,
  frameDepth,
  frameOffsetZ,
  onEnabledChange,
  onShapeChange,
  onAutoSizeChange,
  onWidthChange,
  onHeightChange,
  onThicknessChange,
  onPaddingChange,
  onOffsetZChange,
  onFrameEnabledChange,
  onFrameWidthChange,
  onFrameDepthChange,
  onFrameOffsetZChange,
}: Props) {
  return (
    <section className="panel-controls" aria-labelledby="panel-controls-title">
      <div className="panel-controls-title-row">
        <div>
          <span className="panel-controls-kicker">Основа модели</span>
          <h2 id="panel-controls-title">Задняя панель</h2>
        </div>
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true"><span /></span>
          <span className="sr-only">Включить заднюю панель</span>
        </label>
      </div>

      <div className={`panel-controls-body ${enabled ? "" : "is-disabled"}`}>
        <label className="select-control">
          Форма панели
          <select
            value={shape}
            disabled={!enabled}
            onChange={(event) => onShapeChange(event.target.value as PanelShape)}
          >
            {Object.entries(PANEL_SHAPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="checkbox-control">
          <input
            type="checkbox"
            checked={autoSize}
            disabled={!enabled}
            onChange={(event) => onAutoSizeChange(event.target.checked)}
          />
          <span>Авторазмер по композиции</span>
        </label>

        <RangeNumberControl
          id="panel-padding"
          label="Отступ вокруг композиции"
          value={padding}
          min={0}
          max={80}
          step={2}
          disabled={!enabled || !autoSize}
          onChange={onPaddingChange}
        />

        <RangeNumberControl
          id="panel-width"
          label="Ширина панели"
          value={width}
          min={80}
          max={800}
          step={5}
          disabled={!enabled || autoSize}
          onChange={onWidthChange}
        />

        <RangeNumberControl
          id="panel-height"
          label="Высота панели"
          value={height}
          min={60}
          max={500}
          step={5}
          disabled={!enabled || autoSize}
          onChange={onHeightChange}
        />

        <RangeNumberControl
          id="panel-thickness"
          label="Толщина панели"
          value={thickness}
          min={2}
          max={30}
          disabled={!enabled}
          onChange={onThicknessChange}
        />

        <RangeNumberControl
          id="panel-offset-z"
          label="Зазор панели по Z"
          value={offsetZ}
          min={0}
          max={30}
          disabled={!enabled}
          onChange={onOffsetZChange}
        />

        <div className="panel-frame-divider" />
        <div className="panel-frame-heading">
          <div>
            <strong>Рамка панели</strong>
            <span>Отдельная печатная деталь</span>
          </div>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={frameEnabled}
              disabled={!enabled}
              onChange={(event) => onFrameEnabledChange(event.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true"><span /></span>
            <span className="sr-only">Включить рамку панели</span>
          </label>
        </div>

        <RangeNumberControl
          id="panel-frame-width"
          label="Ширина рамки, мм"
          value={frameWidth}
          min={1}
          max={30}
          step={0.5}
          disabled={!enabled || !frameEnabled}
          onChange={onFrameWidthChange}
        />

        <RangeNumberControl
          id="panel-frame-depth"
          label="Выступ рамки по Z, мм"
          value={frameDepth}
          min={0.5}
          max={20}
          step={0.5}
          disabled={!enabled || !frameEnabled}
          onChange={onFrameDepthChange}
        />

        <RangeNumberControl
          id="panel-frame-offset-z"
          label="Смещение рамки по Z, мм"
          value={frameOffsetZ}
          min={-10}
          max={20}
          step={0.5}
          disabled={!enabled || !frameEnabled}
          onChange={onFrameOffsetZChange}
        />
      </div>
    </section>
  );
}
