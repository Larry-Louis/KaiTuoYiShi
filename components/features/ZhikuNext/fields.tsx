import type { ReactNode } from 'react';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <div className="zn-field__label">{label}</div>
      {children}
    </label>
  );
}

export function PerformanceTextarea({ label, value, editable, rows = 3, placeholder, onChange }: {
  label: string;
  value: string;
  editable: boolean;
  rows?: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editable}
        rows={rows}
        placeholder={placeholder}
        className="tn-input tn-scroll"
      />
    </Field>
  );
}

export function StructuredFlag({ label, checked, editable, onChange }: {
  label: string;
  checked?: boolean;
  editable: boolean;
  onChange: (checked: boolean | undefined) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={typeof checked === 'boolean' ? String(checked) : ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
        disabled={!editable}
        className="tn-input"
      >
        <option value="">继承范围</option>
        <option value="true">允许</option>
        <option value="false">禁止</option>
      </select>
    </Field>
  );
}

export function ToggleRow({ label, checked, disabled, onChange }: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="zn-toggle">
      <span className="min-w-0 truncate">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="zn-section__label">{children}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="zn-empty">
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  );
}
