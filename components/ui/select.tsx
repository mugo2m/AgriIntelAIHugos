"use client";

import * as React from "react";

// Simple implementation that matches the expected structure
export function Select({ value, onValueChange, children, ...props }: any) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  // Clone children and pass context
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Filter out props that shouldn't go to DOM elements
      const childProps: any = {
        isOpen,
        setIsOpen,
        selectedValue,
        handleSelect
      };
      
      return React.cloneElement(child, childProps);
    }
    return child;
  });

  return (
    <div className="relative" {...props}>
      {childrenWithProps}
    </div>
  );
}

export function SelectTrigger({ 
  children, 
  isOpen, 
  setIsOpen, 
  selectedValue,
  handleSelect, // This prop shouldn't go to DOM
  className, 
  ...props 
}: any) {
  // Filter out custom props that shouldn't go to DOM
  const domProps = { ...props };
  // Remove any custom props that might have been passed
  delete domProps.isOpen;
  delete domProps.setIsOpen;
  delete domProps.selectedValue;
  delete domProps.handleSelect;

  return (
    <button
      type="button"
      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      onClick={() => setIsOpen(!isOpen)}
      {...domProps} // Only spread DOM-safe props
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export function SelectValue({ 
  children, 
  placeholder, 
  selectedValue,
  isOpen,
  setIsOpen,
  handleSelect, // Filter out
  className, 
  ...props 
}: any) {
  // Filter out custom props
  const domProps = { ...props };
  delete domProps.isOpen;
  delete domProps.setIsOpen;
  delete domProps.selectedValue;
  delete domProps.handleSelect;

  return (
    <span className="truncate" {...domProps}>
      {children || selectedValue || placeholder || "Select..."}
    </span>
  );
}

export function SelectContent({ 
  children, 
  isOpen, 
  selectedValue,
  setIsOpen,
  handleSelect, // Filter out
  className, 
  ...props 
}: any) {
  if (!isOpen) return null;

  // Filter out custom props
  const domProps = { ...props };
  delete domProps.isOpen;
  delete domProps.setIsOpen;
  delete domProps.selectedValue;
  delete domProps.handleSelect;

  return (
    <div
      className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg"
      {...domProps}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({ 
  children, 
  value, 
  handleSelect,
  isOpen,
  setIsOpen,
  selectedValue, // Filter out
  className, 
  ...props 
}: any) {
  // Filter out custom props
  const domProps = { ...props };
  delete domProps.isOpen;
  delete domProps.setIsOpen;
  delete domProps.selectedValue;
  delete domProps.handleSelect;

  return (
    <div
      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100"
      onClick={() => handleSelect(value)}
      {...domProps}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-current" />
      </span>
      {children}
    </div>
  );
}

// Export other components for compatibility
export const SelectGroup = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const SelectSeparator = ({ className, ...props }: any) => (
  <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} {...props} />
);
