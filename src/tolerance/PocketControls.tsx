import RangeNumberControl from "../components/RangeNumberControl";

type Props = {
  enabled: boolean;
  tolerance: number;
  pocketDepth: number;
  initialDepth: number;
  showMainName: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onToleranceChange: (tolerance: number) => void;
  onPocketDepthChange: (depth: number) => void;
  onShowMainNameChange: (visible: boolean) => void;
};

export default function PocketControls({
  enabled,
  tolerance,
  pocketDepth,
  initialDepth,
  showMainName,
  onEnabledChange,
  onToleranceChange,
  onPocketDepthChange,
  onShowMainNameChange,
}: Props) {
  const throughCut = enabled && pocketDepth >= initialDepth;

  return (
    <section className="pocket-controls" aria-labelledby="pocket-controls-title">
      <div className="panel-controls-title-row">
        <div>
          <span className="panel-controls-kicker">Tolerance</span>
          <h2 id="pocket-controls-title">Посадочный вырез имени</h2>
        </div>
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className="toggle-track" aria-hidden="true"><span /></span>
          <span className="sr-only">Включить посадочный вырез имени</span>
        </label>
      </div>

      <RangeNumberControl
        id="name-tolerance"
        label="Tolerance, мм"
        value={tolerance}
        min={0}
        max={3}
        step={0.05}
        disabled={!enabled}
        onChange={onToleranceChange}
      />

      <RangeNumberControl
        id="name-pocket-depth"
        label="Глубина выреза, мм"
        value={pocketDepth}
        min={0}
        max={initialDepth}
        step={0.5}
        disabled={!enabled}
        onChange={onPocketDepthChange}
      />

      {throughCut && <div className="pocket-through-note">Сквозной вырез большой буквы</div>}

      <label className="checkbox-control pocket-preview-toggle">
        <input
          type="checkbox"
          checked={showMainName}
          onChange={(event) => onShowMainNameChange(event.target.checked)}
        />
        <span>Показать имя в preview</span>
      </label>
      <p className="pocket-help">Скрытие имени влияет только на preview, но не на STL.</p>
    </section>
  );
}
