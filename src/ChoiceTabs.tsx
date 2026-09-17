import { useRef } from "react";

/** Native toggle buttons: selected state, one tab stop and arrow-key navigation. */
export default function ChoiceTabs({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  const group = useRef<HTMLDivElement>(null);
  return (
    <div className="tabs" role="group" aria-label={label} ref={group}>
      {options.map(([key, text], index) => (
        <button
          type="button"
          key={key}
          aria-pressed={value === key}
          tabIndex={value === key ? 0 : -1}
          className={value === key ? "active" : ""}
          onClick={() => onChange(key)}
          onKeyDown={(event) => {
            const next =
              event.key === "ArrowRight"
                ? (index + 1) % options.length
                : event.key === "ArrowLeft"
                  ? (index + options.length - 1) % options.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? options.length - 1
                      : -1;
            if (next < 0) return;
            event.preventDefault();
            onChange(options[next][0]);
            group.current?.querySelectorAll("button")[next]?.focus();
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
