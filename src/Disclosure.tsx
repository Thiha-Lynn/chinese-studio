import { useId, useState, type ReactNode } from "react";

export default function Disclosure({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const content = useId();
  return (
    <section className="panel disclosure">
      <h2 className="disclosure-heading">
        <button
          className="disclosure-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={content}
          onClick={() => setOpen((value) => !value)}
        >
          {label}
        </button>
      </h2>
      <div id={content} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
