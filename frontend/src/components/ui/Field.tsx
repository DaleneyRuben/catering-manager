export const inputCls = (hasError?: boolean) =>
  `w-full border rounded-[9px] px-[14px] py-[11px] text-[14px] bg-white focus:outline-none transition-colors ${
    hasError ? 'border-warn focus:border-warn' : 'border-rule focus:border-olive-600'
  }`;

export const selectCls = (hasError?: boolean) =>
  `w-full border rounded-[9px] px-[14px] py-[11px] text-[14px] bg-white focus:outline-none transition-colors cursor-pointer ${
    hasError ? 'border-warn focus:border-warn' : 'border-rule focus:border-olive-600'
  }`;

export function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5"
      >
        {label}
        {required && <span className="ml-0.5 text-warn">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-warn">{error}</p>}
    </div>
  );
}
