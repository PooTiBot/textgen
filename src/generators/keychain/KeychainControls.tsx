import FontPicker from "../../components/FontPicker";
import RangeNumberControl from "../../components/RangeNumberControl";
import CheckboxControl from "../../components/CheckboxControl";
import SettingsSectionTitle from "../../components/SettingsSectionTitle";
import {
  KEYCHAIN_MOUNT_TYPES,
  KEYCHAIN_MOUNT_TYPE_LABELS,
  KEYCHAIN_SHAPES,
  KEYCHAIN_SHAPE_LABELS,
  KEYCHAIN_TEXT_MODES,
  KEYCHAIN_TEXT_MODE_LABELS,
  type KeychainSettings,
} from "./types";

type Props = {
  settings: KeychainSettings;
  mountWarning: string | null;
  effectiveTextSize: number | null;
  onChange: (patch: Partial<KeychainSettings>) => void;
};

export default function KeychainControls({
  settings,
  mountWarning,
  effectiveTextSize,
  onChange,
}: Props) {
  return (
    <>
      <section className="panel-controls" aria-labelledby="keychain-base-title">
        <div id="keychain-base-title"><SettingsSectionTitle kicker="Base · mm" title="Основа" /></div>
        <label className="select-control">
          Форма
          <select
            value={settings.shape}
            onChange={(event) => onChange({ shape: event.target.value as KeychainSettings["shape"] })}
          >
            {KEYCHAIN_SHAPES.map((shape) => (
              <option key={shape} value={shape}>{KEYCHAIN_SHAPE_LABELS[shape]}</option>
            ))}
          </select>
        </label>
        <RangeNumberControl id="keychain-width" label="Ширина, мм" value={settings.width} min={40} max={140} onChange={(width) => onChange({ width })} />
        <RangeNumberControl id="keychain-height" label="Высота, мм" value={settings.height} min={15} max={60} onChange={(height) => onChange({ height })} />
        <RangeNumberControl
          id="keychain-thickness"
          label="Толщина, мм"
          value={settings.thickness}
          min={1.5}
          max={8}
          step={0.1}
          onChange={(thickness) => onChange({
            thickness,
            pocketDepth: Math.min(settings.pocketDepth, thickness),
          })}
        />
        <RangeNumberControl id="keychain-radius" label="Радиус скругления, мм" value={settings.cornerRadius} min={0} max={20} step={0.5} disabled={settings.shape !== "rounded-rectangle"} onChange={(cornerRadius) => onChange({ cornerRadius })} />
      </section>

      <section className="panel-controls keychain-text-controls" aria-labelledby="keychain-text-title">
        <div id="keychain-text-title"><SettingsSectionTitle kicker="Text" title="Текст" /></div>
        <label className="item-text-control">
          Имя на брелоке
          <input
            type="text"
            value={settings.text}
            maxLength={24}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="Пример"
          />
        </label>
        <FontPicker
          label="Шрифт имени"
          value={settings.fontId}
          previewText={settings.text.trim() || "Пример"}
          mode="name"
          onChange={(fontId) => onChange({ fontId })}
        />
        <label className="select-control">
          Режим текста
          <select
            value={settings.textMode}
            onChange={(event) => onChange({ textMode: event.target.value as KeychainSettings["textMode"] })}
          >
            {KEYCHAIN_TEXT_MODES.map((mode) => (
              <option key={mode} value={mode}>{KEYCHAIN_TEXT_MODE_LABELS[mode]}</option>
            ))}
          </select>
        </label>
        <RangeNumberControl id="keychain-text-size" label="Максимальный размер" value={settings.textSize} min={6} max={36} step={0.5} onChange={(textSize) => onChange({ textSize })} />
        <RangeNumberControl id="keychain-text-depth" label="Толщина текста, мм" value={settings.textDepth} min={0.4} max={5} step={0.1} onChange={(textDepth) => onChange({ textDepth })} />
        <RangeNumberControl id="keychain-text-x" label="Положение X, мм" value={settings.textX} min={-50} max={50} step={0.5} onChange={(textX) => onChange({ textX })} />
        <RangeNumberControl id="keychain-text-y" label="Положение Y, мм" value={settings.textY} min={-25} max={25} step={0.5} onChange={(textY) => onChange({ textY })} />
        <CheckboxControl label="Автоматически вписать текст" checked={settings.autoFit} onChange={(autoFit) => onChange({ autoFit })} />
        <RangeNumberControl id="keychain-padding" label="Отступ от краёв, мм" value={settings.padding} min={1} max={10} step={0.5} disabled={!settings.autoFit} onChange={(padding) => onChange({ padding })} />
        {settings.autoFit && effectiveTextSize !== null && (
          <p className="keychain-info">Фактический размер: {effectiveTextSize.toFixed(1)} мм</p>
        )}
        {settings.textMode === "inlay" && (
          <div className="keychain-inlay-settings">
            <RangeNumberControl id="keychain-tolerance" label="Tolerance, мм" value={settings.tolerance} min={0} max={3} step={0.05} onChange={(tolerance) => onChange({ tolerance })} />
            <RangeNumberControl id="keychain-pocket-depth" label="Глубина выреза, мм" value={settings.pocketDepth} min={0.2} max={settings.thickness} step={0.1} onChange={(pocketDepth) => onChange({ pocketDepth })} />
            <p className="keychain-info">Вырез строится реальным Clipper-offset по контуру текста.</p>
          </div>
        )}
      </section>

      <section className="panel-controls" aria-labelledby="keychain-mount-title">
        <div id="keychain-mount-title"><SettingsSectionTitle kicker="Mount" title="Крепление" /></div>
        <label className="select-control">
          Тип крепления
          <select
            value={settings.mountType}
            onChange={(event) => onChange({ mountType: event.target.value as KeychainSettings["mountType"] })}
          >
            {KEYCHAIN_MOUNT_TYPES.map((type) => (
              <option key={type} value={type}>{KEYCHAIN_MOUNT_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </label>

        {settings.mountType === "hole" ? (
          <>
            <CheckboxControl label="Сквозное отверстие" checked={settings.holeEnabled} onChange={(holeEnabled) => onChange({ holeEnabled })} />
            <RangeNumberControl id="keychain-hole-diameter" label="Диаметр, мм" value={settings.holeDiameter} min={2} max={12} step={0.5} disabled={!settings.holeEnabled} onChange={(holeDiameter) => onChange({ holeDiameter })} />
            <RangeNumberControl id="keychain-hole-x" label="Положение X, мм" value={settings.holeX} min={-60} max={60} step={0.5} disabled={!settings.holeEnabled} onChange={(holeX) => onChange({ holeX })} />
            <RangeNumberControl id="keychain-hole-y" label="Положение Y, мм" value={settings.holeY} min={-25} max={25} step={0.5} disabled={!settings.holeEnabled} onChange={(holeY) => onChange({ holeY })} />
          </>
        ) : (
          <>
            <label className="select-control">
              Сторона
              <select value={settings.loopSide} onChange={(event) => onChange({ loopSide: event.target.value as KeychainSettings["loopSide"] })}>
                <option value="left">Слева</option>
                <option value="right">Справа</option>
              </select>
            </label>
            <RangeNumberControl id="keychain-loop-outer" label="Внешний диаметр, мм" value={settings.loopOuterDiameter} min={6} max={20} step={0.5} onChange={(loopOuterDiameter) => onChange({ loopOuterDiameter })} />
            <RangeNumberControl id="keychain-loop-inner" label="Внутренний диаметр, мм" value={settings.loopInnerDiameter} min={2} max={14} step={0.5} onChange={(loopInnerDiameter) => onChange({ loopInnerDiameter })} />
          </>
        )}
        {mountWarning && <div className="export-warning" role="status">{mountWarning}</div>}
      </section>
    </>
  );
}
