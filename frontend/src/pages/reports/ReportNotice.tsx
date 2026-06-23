export function ReportNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] text-[#7a5e0c] bg-warn-bg border border-warn-border rounded-[9px] px-[13px] py-[10px] mb-4">
      {children}
    </div>
  );
}
