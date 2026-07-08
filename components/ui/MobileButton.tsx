// components/ui/MobileButton.tsx
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useMobile } from '@/lib/hooks/useMobile';
import { useTouchFeedback } from '@/lib/hooks/useTouchFeedback';
import { Button } from './button';

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  mobileFullWidth?: boolean;
  touchFeedback?: boolean;
  hapticFeedback?: boolean;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({
    children,
    className = '',
    variant = 'default',
    size = 'default',
    mobileFullWidth = false,
    touchFeedback = true,
    hapticFeedback = false,
    onClick,
    ...props
  }, ref) => {
    const { isMobile } = useMobile();
    const { touchProps, isTouching } = useTouchFeedback({
      vibrate: hapticFeedback,
      onTouch: touchFeedback ? undefined : undefined,
    });

    const mobileClasses = isMobile
      ? `
        ${mobileFullWidth ? 'w-full' : ''}
        min-h-[48px]
        text-base
        px-4 py-3
        active:scale-95 active:opacity-90
        transition-all duration-150
      `
      : '';

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
      onClick?.(e);
    };

    // If on mobile and touch feedback is enabled, spread touch props
    const extraProps = isMobile && touchFeedback ? touchProps : {};

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={`${className} ${mobileClasses}`}
        onClick={handleClick}
        {...extraProps}
        {...props}
      >
        {children}
        {isTouching && (
          <span className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
        )}
      </Button>
    );
  }
);

MobileButton.displayName = 'MobileButton';