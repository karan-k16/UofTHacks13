'use client';

import { forwardRef } from 'react';
import classNames from 'classnames';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      isLoading,
      fullWidth,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ps-bg-800';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-ps-accent-primary text-white hover:bg-opacity-90 focus:ring-ps-accent-primary',
      secondary:
        'bg-ps-bg-500 text-ps-text-primary hover:bg-ps-bg-400 focus:ring-ps-bg-400',
      ghost:
        'bg-transparent text-ps-text-secondary hover:bg-ps-bg-600 hover:text-ps-text-primary focus:ring-ps-bg-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-2 py-1 text-xs gap-1',
      md: 'px-3 py-1.5 text-xs gap-1.5',
      lg: 'px-4 py-2 text-sm gap-2',
    };

    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

    return (
      <button
        ref={ref}
        className={classNames(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && disabledStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="loading-spinner w-4 h-4" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

