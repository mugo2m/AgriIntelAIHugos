import * as React from 'react';

export function Textarea({ className, ...props }: any) {
  return <textarea className={`border rounded p-2 w-full ${className}`} {...props} />;
}
