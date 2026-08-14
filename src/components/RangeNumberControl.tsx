type Props = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export default function RangeNumberControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: Props) {
  const updateValue = (nextValue: number) => {
    if (Number.isFinite(nextValue)) {
      onChange(Math.min(max, Math.max(min, nextValue)));
    }
  };

  return (
    <div className={`control-group range-number-control ${disabled ? "is-disabled" : ""}`}>
      <div className="range-number-heading">
        <label htmlFor={`${id}-number`}>{label}</label>
        <input
          id={`${id}-number`}
          className="range-number-input"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => updateValue(event.target.valueAsNumber)}
        />
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => updateValue(event.target.valueAsNumber)}
      />
    </div>
  );
}
