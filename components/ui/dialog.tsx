import * as React from 'react';

export function Dialog({ children, open, onOpenChange, ...props }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => onOpenChange?.(false)}>
      <div className="bg-white rounded-lg" onClick={(e) => e.stopPropagation()} {...props}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className, ...props }: any) {
  return <div className={`bg-white rounded-lg p-6 ${className}`} {...props}>{children}</div>;
}

export function DialogHeader({ children, ...props }: any) {
  return <div className="mb-4" {...props}>{children}</div>;
}

export function DialogTitle({ children, ...props }: any) {
  return <h2 className="text-lg font-bold" {...props}>{children}</h2>;
}

export function DialogDescription({ children, ...props }: any) {
  return <p className="text-gray-600 text-sm" {...props}>{children}</p>;
}

export function DialogFooter({ children, ...props }: any) {
  return <div className="mt-6 flex justify-end gap-2" {...props}>{children}</div>;
}
