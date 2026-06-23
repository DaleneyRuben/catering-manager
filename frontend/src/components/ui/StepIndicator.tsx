import { Fragment } from 'react';
import { Icon } from './Icon';

function stepCircleClass(isActive: boolean, isDone: boolean): string {
  if (isDone) return 'bg-olive-700 text-olive-50 border-olive-700';
  if (isActive) return 'bg-olive-100 text-olive-700 border-olive-700';
  return 'bg-paper text-placeholder border-rule';
}

function stepLabelClass(isActive: boolean, isDone: boolean): string {
  if (isDone) return 'font-semibold text-ink-2';
  if (isActive) return 'font-bold text-ink';
  return 'font-medium text-empty-text';
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const n = i + 1;
        const isActive = n === current;
        const isDone = n < current;
        const isLast = i === steps.length - 1;
        return (
          <Fragment key={label}>
            <div className="flex items-center gap-[11px] shrink-0">
              <div
                className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-mono font-semibold border-[1.5px] shrink-0 ${stepCircleClass(isActive, isDone)}`}
              >
                {isDone ? <Icon name="check" size={13} stroke={2} /> : n}
              </div>
              <span
                className={`text-[13.5px] whitespace-nowrap ${stepLabelClass(isActive, isDone)}`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-[1.5px] min-w-[24px] mx-[14px] ${isDone ? 'bg-done-line' : 'bg-rule'}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
