type Option<T extends string> = { value: T; label: string; className?: string };

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel
}: {
  value: T;
  options: Option<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`${opt.className ?? ""} ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
