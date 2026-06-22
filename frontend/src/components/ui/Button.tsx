import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'destructive' | 'alert';
export type ButtonSize = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-[9px] font-semibold leading-none rounded-[9px] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100';

const VARIANT_CLS: Record<ButtonVariant, string> = {
  primary: 'bg-olive-700 text-white hover:bg-olive-800',
  secondary: 'text-muted hover:text-ink-2',
  danger: 'border border-rule text-warn hover:bg-cream-2',
  destructive: 'bg-warn text-white hover:opacity-90',
  alert: 'border border-[#e9c4bb] text-alert hover:bg-cream-2',
};

const SIZE_CLS: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-[12px]',
  md: 'px-[20px] py-[12px] text-[13.5px]',
};

const ICON_SIZE: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
};

export function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className = '',
  ...props
}: Props) {
  const iconSlot = loading ? (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
  ) : null;

  const leftIconSlot =
    !loading && leftIcon ? <Icon name={leftIcon} size={ICON_SIZE[size]} /> : null;

  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      {...props}
      disabled={disabled || loading}
      className={`${BASE} ${VARIANT_CLS[variant]} ${SIZE_CLS[size]} ${className}`}
    >
      {iconSlot}
      {leftIconSlot}
      {children}
      {!loading && rightIcon ? <Icon name={rightIcon} size={ICON_SIZE[size]} /> : null}
    </button>
  );
}
