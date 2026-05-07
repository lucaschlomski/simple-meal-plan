import { Minus, Plus } from "lucide-react";
import type { LanguageMode } from "../lib/types";
import { t } from "../lib/i18n";

export function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled,
  language = "en"
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  language?: LanguageMode;
}) {
  return (
    <div className="stepper" role="group" aria-label={t(language, "stepper.groupSize")}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={t(language, "stepper.decrease")}
      >
        <Minus size={14} />
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={t(language, "stepper.increase")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
