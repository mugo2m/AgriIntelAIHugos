// lib/hooks/useTouchFeedback.ts
import { useCallback, useState } from 'react';

interface TouchFeedbackOptions {
  duration?: number;
  scale?: number;
  opacity?: number;
  onTouch?: () => void;
  vibrate?: boolean | number;
}

export const useTouchFeedback = (options: TouchFeedbackOptions = {}) => {
  const {
    duration = 150,
    scale = 0.97,
    opacity = 0.9,
    onTouch,
    vibrate = false
  } = options;

  const [isTouching, setIsTouching] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsTouching(true);

    // Optional haptic feedback
    if (vibrate && 'vibrate' in navigator) {
      const pattern = typeof vibrate === 'number' ? vibrate : 20;
      navigator.vibrate(pattern);
    }

    onTouch?.();
  }, [onTouch, vibrate]);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => setIsTouching(false), duration);
  }, [duration]);

  const handleTouchCancel = useCallback(() => {
    setIsTouching(false);
  }, []);

  const style = isTouching
    ? {
        transform: `scale(${scale})`,
        opacity,
        transition: `transform ${duration}ms ease, opacity ${duration}ms ease`,
      }
    : {
        transition: `transform ${duration}ms ease, opacity ${duration}ms ease`,
      };

  return {
    touchProps: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
      style,
    },
    isTouching,
  };
};