import CheckboxControl from "../components/CheckboxControl";
import RangeNumberControl from "../components/RangeNumberControl";
import SettingsSectionTitle from "../components/SettingsSectionTitle";
import {
  PHOTO_WINDOW_MODE_LABELS,
  PHOTO_WINDOW_SHAPE_LABELS,
  type PhotoWindowMode,
  type PhotoWindowSettings,
  type PhotoWindowShape,
} from "./types";

type Props = {
  settings: PhotoWindowSettings;
  panelEnabled: boolean;
  panelThickness: number;
  onChange: (patch: Partial<PhotoWindowSettings>) => void;
};

export default function PhotoWindowControls({ settings, panelEnabled, panelThickness, onChange }: Props) {
  const disabled = !settings.enabled || !panelEnabled;
  return (
    <section className="panel-controls" aria-labelledby="photo-window-title">
      <div id="photo-window-title"><SettingsSectionTitle kicker="Photo area" title="Окно для фотографии" /></div>
      <CheckboxControl label="Добавить фотозону" checked={settings.enabled} disabled={!panelEnabled} onChange={(enabled) => onChange({ enabled })} />
      <label className="select-control">
        Форма
        <select disabled={disabled} value={settings.shape} onChange={(event) => onChange({ shape: event.target.value as PhotoWindowShape })}>
          {(Object.keys(PHOTO_WINDOW_SHAPE_LABELS) as PhotoWindowShape[]).map((shape) => <option key={shape} value={shape}>{PHOTO_WINDOW_SHAPE_LABELS[shape]}</option>)}
        </select>
      </label>
      <label className="select-control">
        Режим
        <select disabled={disabled} value={settings.mode} onChange={(event) => onChange({ mode: event.target.value as PhotoWindowMode })}>
          {(Object.keys(PHOTO_WINDOW_MODE_LABELS) as PhotoWindowMode[]).map((mode) => <option key={mode} value={mode}>{PHOTO_WINDOW_MODE_LABELS[mode]}</option>)}
        </select>
      </label>
      <RangeNumberControl id="photo-width" label="Ширина, мм" value={settings.width} min={20} max={300} step={1} disabled={disabled} onChange={(width) => onChange({ width })} />
      <RangeNumberControl id="photo-height" label="Высота, мм" value={settings.height} min={20} max={250} step={1} disabled={disabled} onChange={(height) => onChange({ height })} />
      <RangeNumberControl id="photo-x" label="Положение X, мм" value={settings.x} min={-300} max={300} step={1} disabled={disabled} onChange={(x) => onChange({ x })} />
      <RangeNumberControl id="photo-y" label="Положение Y, мм" value={settings.y} min={-250} max={250} step={1} disabled={disabled} onChange={(y) => onChange({ y })} />
      <RangeNumberControl id="photo-padding" label="Монтажный зазор, мм" value={settings.padding} min={0} max={15} step={0.5} disabled={disabled} onChange={(padding) => onChange({ padding })} />
      <RangeNumberControl id="photo-corner-radius" label="Радиус углов, мм" value={settings.cornerRadius} min={0} max={60} step={1} disabled={disabled || settings.shape !== "rounded-rectangle"} onChange={(cornerRadius) => onChange({ cornerRadius })} />
      <RangeNumberControl id="photo-recess-depth" label="Глубина углубления, мм" value={settings.recessDepth} min={0.2} max={Math.max(0.2, panelThickness)} step={0.1} disabled={disabled || settings.mode !== "recess"} onChange={(recessDepth) => onChange({ recessDepth })} />
      <RangeNumberControl id="photo-outline-depth" label="Толщина контура, мм" value={settings.depth} min={0.5} max={10} step={0.5} disabled={disabled || settings.mode !== "frame-only" || settings.innerFrameEnabled} onChange={(depth) => onChange({ depth })} />

      <div className="panel-frame-divider" />
      <CheckboxControl label="Отдельная внутренняя рамка" checked={settings.innerFrameEnabled} disabled={disabled} onChange={(innerFrameEnabled) => onChange({ innerFrameEnabled })} />
      <RangeNumberControl id="photo-frame-width" label="Ширина рамки, мм" value={settings.innerFrameWidth} min={0.5} max={25} step={0.5} disabled={disabled || !settings.innerFrameEnabled} onChange={(innerFrameWidth) => onChange({ innerFrameWidth })} />
      <RangeNumberControl id="photo-frame-depth" label="Толщина рамки, мм" value={settings.innerFrameDepth} min={0.5} max={15} step={0.5} disabled={disabled || !settings.innerFrameEnabled} onChange={(innerFrameDepth) => onChange({ innerFrameDepth })} />
      <RangeNumberControl id="photo-frame-z" label="Смещение рамки по Z, мм" value={settings.innerFrameOffsetZ} min={-10} max={20} step={0.5} disabled={disabled || !settings.innerFrameEnabled} onChange={(innerFrameOffsetZ) => onChange({ innerFrameOffsetZ })} />
    </section>
  );
}
