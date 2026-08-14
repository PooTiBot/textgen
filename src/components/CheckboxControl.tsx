type Props = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export default function CheckboxControl({
  label,
  checked,
  disabled = false,
  onChange,
}: Props) {
  return (
    <label className="checkbox-control">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
