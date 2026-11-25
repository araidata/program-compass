"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useMethods } from "@/components/planning/method-provider";
import { levelFill, levelInk } from "@/components/analytics/maturity";

/**
 * Keyboard-driven 1–5 rating (P-13). Left/Right or 1–5 set the level,
 * 0/Backspace/Delete clear it, Up/Down move to the same column in the
 * adjacent row, Enter opens the detail panel.
 */
export function RatingInput({
  value,
  onChange,
  label,
  column,
  row,
  onOpen,
  disabled = false,
  size = "sm",
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
  column?: string;
  row?: number;
  onOpen?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const { levelName, levels: maturityLevels } = useMethods();
  const group = useRef<HTMLDivElement>(null);

  function focusLevel(level: number) {
    group.current
      ?.querySelector<HTMLButtonElement>(`[data-level="${level}"]`)
      ?.focus();
  }

  function moveRow(delta: number) {
    if (column == null || row == null) return;
    const next = document.querySelector<HTMLElement>(
      `[data-rating-column="${column}"][data-rating-row="${row + delta}"]`,
    );
    next?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;
    const key = event.key;
    if (/^[1-5]$/.test(key)) {
      event.preventDefault();
      onChange(Number(key));
      focusLevel(Number(key));
    } else if (key === "0" || key === "Backspace" || key === "Delete") {
      event.preventDefault();
      onChange(null);
    } else if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      const base = value ?? (key === "ArrowRight" ? 0 : 6);
      const next = Math.min(
        5,
        Math.max(1, base + (key === "ArrowRight" ? 1 : -1)),
      );
      onChange(next);
      focusLevel(next);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      moveRow(key === "ArrowDown" ? 1 : -1);
    } else if (key === "Enter" && onOpen) {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-rating-column={column}
      data-rating-row={row}
      onKeyDown={onKeyDown}
      className="inline-flex rounded-md border bg-card p-0.5"
    >
      {maturityLevels.map((entry) => {
        const selected = value === entry.level;
        const focusable = value == null ? entry.level === 1 : selected;
        return (
          <button
            key={entry.level}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${entry.level} ${entry.name}`}
            title={`${entry.level} ${entry.name}: ${entry.definition}`}
            data-level={entry.level}
            tabIndex={focusable ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(selected ? null : entry.level)}
            className={cn(
              "flex items-center justify-center rounded-[3px] text-[11px] font-semibold tabular transition-colors focus-visible:relative focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-40",
              size === "sm" ? "h-6 w-6" : "h-7 w-9 text-xs",
              selected
                ? cn(levelFill[entry.level], levelInk[entry.level])
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {entry.level}
          </button>
        );
      })}
      <span className="sr-only">
        {value == null ? "Not set" : `Selected ${value} ${levelName(value)}`}
      </span>
    </div>
  );
}
