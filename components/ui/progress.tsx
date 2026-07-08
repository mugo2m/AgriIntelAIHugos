import * as React from 'react';

export function Progress({ value, className, ...props }: any) {
  return (
    <div className={`bg-gray-200 rounded h-2 ${className}`} {...props}>
      <div className="bg-blue-500 h-2 rounded" style={{ width: `${value}%` }} />
    </div>
  );
}
