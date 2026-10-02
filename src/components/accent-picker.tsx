import { Check, Palette, X } from "lucide-react";
import { useState } from "react";

import type { UseAccentResult } from "../hooks/use-accent";
import { cn } from "../lib/utils";

type AccentPickerProps = UseAccentResult;

export function AccentPicker({ accent, accents, setAccent }: AccentPickerProps) {
  const [open, setOpen] = useState(false);

  function handleAccentSelect(id: string) {
    setAccent(id);
    setOpen(false);
  }

  return (
    <section
      className="fixed right-6 bottom-20 z-50 flex flex-col items-end gap-3"
      aria-label="调色器"
      data-testid="accent-picker"
      onMouseLeave={() => setOpen(false)}
    >
      {open ? (
        <div className="reveal soft-card flex w-56 flex-col gap-3 bg-card/95 p-4 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              水墨 · 换色
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="收起调色器"
              className="text-muted-foreground transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <fieldset className="grid grid-cols-5 gap-2" aria-label="强调色">
            {accents.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAccentSelect(option.id)}
                title={option.label}
                aria-label={option.label}
                aria-pressed={accent.id === option.id}
                className={cn(
                  "relative grid h-8 w-8 place-items-center rounded-full border border-ink/30 transition-transform hover:scale-110",
                  accent.id === option.id && "ring-2 ring-ink ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: `hsl(${option.light})` }}
              >
                {accent.id === option.id ? (
                  <Check className="h-4 w-4 text-white drop-shadow" />
                ) : null}
              </button>
            ))}
          </fieldset>

          <span className="font-display text-sm font-bold text-ink">{accent.label}</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="打开调色器"
        aria-expanded={open}
        className="btn-ink grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        <Palette className="h-5 w-5" />
      </button>
    </section>
  );
}
