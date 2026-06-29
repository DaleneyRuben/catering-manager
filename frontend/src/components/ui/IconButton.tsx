import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: string;
  label: string;
  size?: number;
  stroke?: number;
}

export function IconButton({ icon, label, size = 16, stroke, className = '', ...props }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex items-center justify-center transition-colors ${className}`}
      {...props}
    >
      <Icon name={icon} size={size} stroke={stroke} />
    </button>
  );
}
