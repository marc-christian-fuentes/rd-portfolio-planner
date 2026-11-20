/**
 * A number box that updates the model on every keystroke (live), but lets
 * you type freely (e.g. clear the box, or type "1." on the way to "1.5").
 * Input text is blue, following the spreadsheet convention: blue = input, black = formula.
 */
import { useEffect, useRef, useState } from 'react';

export function NumberInput({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  className = 'w-20',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  ariaLabel: string;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  // Show outside changes (e.g. switching project) unless the person is typing here.
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(value));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const n = Number(raw.replace(/[,$%\s]/g, ''));
        if (raw.trim() === '' || !Number.isFinite(n)) return;
        let v = n;
        if (min !== undefined) v = Math.max(min, v);
        if (max !== undefined) v = Math.min(max, v);
        onChange(v);
      }}
      className={`num rounded-md border border-moss-200 bg-moss-50 px-1.5 py-0.5 text-right text-[13px] text-slateblue hover:border-moss-400 focus:border-moss-600 focus:bg-white focus:outline-none ${className}`}
    />
  );
}
