import { useLayoutEffect, useRef, useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className = '' }: Props) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // useLayoutEffect fires before paint so the initial position is set without animation
  useLayoutEffect(() => {
    const el = buttonRefs.current[activeId];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeId]);

  return (
    <div role="tablist" className={`relative flex border-b border-rule ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            buttonRefs.current[tab.id] = el;
          }}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-[13px] font-medium transition-colors ${
            activeId === tab.id ? 'text-ink' : 'text-muted hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}

      {/* Sliding active indicator — positioned before paint so no initial slide */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 h-0.5 bg-olive-800 transition-all duration-200 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  );
}
