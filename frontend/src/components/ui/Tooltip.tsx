import { isValidElement, useState, type ReactNode } from 'react';

interface Props {
  content: string;
  children: ReactNode;
  align?: 'center' | 'end';
}

const ALIGN_CLS: Record<NonNullable<Props['align']>, string> = {
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

// A real disabled <button> never dispatches mouse events — not even to ancestors — so hover
// listeners on the wrapper alone never fire for it. There's nothing to lose by capturing the
// hover in front of it instead: a disabled control isn't clickable either way.
function isDisabledTrigger(children: ReactNode): boolean {
  return isValidElement<{ disabled?: boolean }>(children) && Boolean(children.props.disabled);
}

export function Tooltip({ content, children, align = 'end' }: Props) {
  const [visible, setVisible] = useState(false);
  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const disabledTrigger = isDisabledTrigger(children);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {disabledTrigger && (
        <span
          data-testid="tooltip-disabled-overlay"
          className="absolute inset-0"
          onMouseEnter={show}
          onMouseLeave={hide}
        />
      )}
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
