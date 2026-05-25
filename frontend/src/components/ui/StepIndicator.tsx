import { Fragment } from 'react';
import { Icon } from './Icon';

function stepCircleClass(isActive: boolean, isDone: boolean): string {
  if (isActive) return 'bg-olive-800 text-white';
  if (isDone) return 'bg-ok-bg text-ok';
  return 'bg-cream-2 border border-rule text-muted';
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start">
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center min-w-[56px] sm:min-w-[72px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-medium ${stepCircleClass(isActive, isDone)}`}
              >
                {isDone ? <Icon name="check" size={12} stroke={2} /> : n}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] mt-1.5 text-center ${isActive ? 'font-medium text-ink' : 'text-muted'}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-[1px] mt-4 ${isDone ? 'bg-ok' : 'bg-rule'}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
