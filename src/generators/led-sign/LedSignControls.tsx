import CheckboxControl from "../../components/CheckboxControl";
import FontPicker from "../../components/FontPicker";
import RangeNumberControl from "../../components/RangeNumberControl";
import SettingsSectionTitle from "../../components/SettingsSectionTitle";
import {
  LED_LETTER_MODE_LABELS,
  type LedLetterMode,
  type LedSignSettings,
} from "./types";

type Props = {
  settings: LedSignSettings;
  effectiveTextSize: number | null;
  onChange: (patch: Partial<LedSignSettings>) => void;
};

export default function LedSignControls({ settings, effectiveTextSize, onChange }: Props) {
  return (
    <>
      <section className="panel-controls" aria-labelledby="led-text-title">
        <div id="led-text-title"><SettingsSectionTitle kicker="Channel letters · mm" title="Текст вывески" /></div>
        <label className="item-text-control">
          Текст
          <input type="text" value={settings.text} maxLength={48} placeholder="Пример" onChange={(event) => onChange({ text: event.target.value })} />
        </label>
        <FontPicker label="Шрифт" value={settings.fontId} previewText={settings.text.trim() || "Пример"} mode="name" onChange={(fontId) => onChange({ fontId })} />
        <label className="select-control">
          Сборка букв
          <select value={settings.letterMode} onChange={(event) => onChange({ letterMode: event.target.value as LedLetterMode })}>
            {(Object.keys(LED_LETTER_MODE_LABELS) as LedLetterMode[]).map((mode) => (
              <option key={mode} value={mode}>{LED_LETTER_MODE_LABELS[mode]}</option>
            ))}
          </select>
        </label>
        <RangeNumberControl id="led-text-size" label="Размер текста, мм" value={settings.textSize} min={10} max={160} step={1} onChange={(textSize) => onChange({ textSize })} />
        <RangeNumberControl id="led-letter-spacing" label="Интервал букв, мм" value={settings.letterSpacing} min={-5} max={20} step={0.5} onChange={(letterSpacing) => onChange({ letterSpacing })} />
        <RangeNumberControl id="led-text-x" label="Положение X, мм" value={settings.textX} min={-180} max={180} step={1} onChange={(textX) => onChange({ textX })} />
        <RangeNumberControl id="led-text-y" label="Положение Y, мм" value={settings.textY} min={-90} max={90} step={1} onChange={(textY) => onChange({ textY })} />
        <CheckboxControl label="Автоматически вписать" checked={settings.autoFit} onChange={(autoFit) => onChange({ autoFit })} />
        <RangeNumberControl id="led-max-width" label="Максимальная ширина, мм" value={settings.maxWidth} min={60} max={500} step={5} disabled={!settings.autoFit} onChange={(maxWidth) => onChange({ maxWidth })} />
        <RangeNumberControl id="led-max-height" label="Максимальная высота, мм" value={settings.maxHeight} min={30} max={250} step={5} disabled={!settings.autoFit} onChange={(maxHeight) => onChange({ maxHeight })} />
        {settings.autoFit && effectiveTextSize !== null && <p className="keychain-info">Фактический размер: {effectiveTextSize.toFixed(1)} мм</p>}
      </section>

      <section className="panel-controls" aria-labelledby="led-shell-title">
        <div id="led-shell-title"><SettingsSectionTitle kicker="Body" title="Корпус букв" /></div>
        <RangeNumberControl id="led-shell-offset" label="Расширение контура, мм" value={settings.shellOffset} min={0} max={10} step={0.25} onChange={(shellOffset) => onChange({ shellOffset })} />
        <RangeNumberControl id="led-wall-height" label="Высота стенок, мм" value={settings.wallHeight} min={5} max={50} step={0.5} onChange={(wallHeight) => onChange({ wallHeight, capThickness: Math.min(settings.capThickness, wallHeight - 0.5) })} />
        <RangeNumberControl id="led-wall-thickness" label="Толщина стенок, мм" value={settings.wallThickness} min={0.8} max={6} step={0.1} onChange={(wallThickness) => onChange({ wallThickness })} />
        <RangeNumberControl id="led-base-thickness" label="Толщина основания, мм" value={settings.baseThickness} min={0.8} max={6} step={0.2} onChange={(baseThickness) => onChange({ baseThickness })} />
      </section>

      <section className="panel-controls" aria-labelledby="led-cap-title">
        <div id="led-cap-title"><SettingsSectionTitle kicker="Face cap" title="Светорассеивающая крышка" /></div>
        <RangeNumberControl id="led-cap-thickness" label="Толщина крышки, мм" value={settings.capThickness} min={0.6} max={Math.max(0.6, settings.wallHeight - 0.5)} step={0.1} onChange={(capThickness) => onChange({ capThickness })} />
        <RangeNumberControl id="led-cap-tolerance" label="Посадочный зазор, мм" value={settings.capTolerance} min={0} max={2} step={0.05} onChange={(capTolerance) => onChange({ capTolerance })} />
        <RangeNumberControl id="led-cap-inset" label="Дополнительный отступ, мм" value={settings.capInset} min={0} max={3} step={0.05} onChange={(capInset) => onChange({ capInset })} />
        <CheckboxControl label="Добавить посадочную полку" checked={settings.capSeatEnabled} onChange={(capSeatEnabled) => onChange({ capSeatEnabled })} />
        <RangeNumberControl id="led-cap-seat-depth" label="Глубина полки, мм" value={settings.capSeatDepth} min={0.2} max={Math.max(0.2, settings.wallHeight - settings.capThickness)} step={0.1} disabled={!settings.capSeatEnabled} onChange={(capSeatDepth) => onChange({ capSeatDepth })} />
      </section>

      <section className="panel-controls" aria-labelledby="led-wire-title">
        <div id="led-wire-title"><SettingsSectionTitle kicker="Cable" title="Отверстие для провода" /></div>
        <CheckboxControl label="Добавить отверстие" checked={settings.wireHoleEnabled} onChange={(wireHoleEnabled) => onChange({ wireHoleEnabled })} />
        <RangeNumberControl id="led-wire-diameter" label="Диаметр, мм" value={settings.wireHoleDiameter} min={2} max={20} step={0.5} disabled={!settings.wireHoleEnabled} onChange={(wireHoleDiameter) => onChange({ wireHoleDiameter })} />
        <RangeNumberControl id="led-wire-x" label="Положение X, мм" value={settings.wireHoleX} min={-180} max={180} step={1} disabled={!settings.wireHoleEnabled} onChange={(wireHoleX) => onChange({ wireHoleX })} />
        <RangeNumberControl id="led-wire-y" label="Положение Y, мм" value={settings.wireHoleY} min={-90} max={90} step={1} disabled={!settings.wireHoleEnabled} onChange={(wireHoleY) => onChange({ wireHoleY })} />
      </section>

      <section className="panel-controls" aria-labelledby="led-preview-title">
        <div id="led-preview-title"><SettingsSectionTitle kicker="Preview only" title="Просмотр деталей" /></div>
        <CheckboxControl label="Показывать основание" checked={settings.showBase} onChange={(showBase) => onChange({ showBase })} />
        <CheckboxControl label="Показывать стенки" checked={settings.showWalls} onChange={(showWalls) => onChange({ showWalls })} />
        <CheckboxControl label="Показывать крышки" checked={settings.showCaps} onChange={(showCaps) => onChange({ showCaps })} />
        <RangeNumberControl id="led-exploded" label="Разнести детали, мм" value={settings.explodedView} min={0} max={30} step={1} onChange={(explodedView) => onChange({ explodedView })} />
        <p className="keychain-info">Разнесение действует только в preview и не меняет STL.</p>
      </section>
    </>
  );
}
