import { useState, type ReactNode } from 'react';

interface Props {
  content: string;
  children: ReactNode;
  align?: 'center' | 'end';
}

const ALIGN_CLS: Record<NonNullable<Props['align']>, string> = {
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

// Hover/focus listeners live on the wrapper, not the trigger itself, so the tooltip still shows
// when the trigger is a native disabled <button> (which stops receiving its own DOM events).
export function Tooltip({ content, children, align = 'end' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute top-[calc(100%+9px)] z-40 w-[268px] max-w-[calc(100vw-80px)] rounded-[10px] bg-tooltip-bg px-[13px] py-[10px] text-[12px] leading-[1.5] text-tooltip-text shadow-[var(--shadow-tooltip)] ${ALIGN_CLS[align]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
