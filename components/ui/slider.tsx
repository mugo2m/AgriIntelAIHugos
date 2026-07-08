import * as React from 'react';

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }: any) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseInt(e.target.value)])}
      className={`w-full ${className}`}
      {...props}
    />
  );
}
