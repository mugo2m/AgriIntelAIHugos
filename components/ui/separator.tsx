import * as React from 'react';

export function Separator({ className, ...props }: any) {
  return <hr className={`border-t my-4 ${className}`} {...props} />;
}
