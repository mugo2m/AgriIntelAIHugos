import * as React from 'react';

export function Switch({ checked, onCheckedChange, className, ...props }: any) {
  return (
    <button
      className={`w-12 h-6 rounded-full ${checked ? 'bg-blue-500' : 'bg-gray-300'} ${className}`}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
