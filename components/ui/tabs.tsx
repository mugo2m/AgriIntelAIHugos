"use client";

import * as React from "react";

export function Tabs({ defaultValue, children, ...props }: any) {
  const [value, setValue] = React.useState(defaultValue);
  
  // Clone children and pass props, but children will filter them
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { value, setValue });
    }
    return child;
  });

  return <div {...props}>{childrenWithProps}</div>;
}

export function TabsList({ 
  children, 
  value, // Filter out
  setValue, // Filter out
  className, 
  ...props 
}: any) {
  // Filter out custom props
  const domProps = { ...props };
  delete domProps.value;
  delete domProps.setValue;

  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`} {...domProps}>
      {children}
    </div>
  );
}

export function TabsTrigger({ 
  children, 
  value: tabValue, 
  value: activeValue, 
  setValue, 
  className, 
  ...props 
}: any) {
  const isActive = activeValue === tabValue;
  
  // Filter out custom props
  const domProps = { ...props };
  delete domProps.value;
  delete domProps.setValue;

  return (
    <button
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium
        ${isActive ? "bg-white shadow" : "text-gray-600"}
        ${className}
      `}
      onClick={() => setValue(tabValue)}
      {...domProps}
    >
      {children}
    </button>
  );
}

export function TabsContent({ 
  children, 
  value: tabValue, 
  value: activeValue,
  setValue, // Filter out
  ...props 
}: any) {
  if (tabValue !== activeValue) return null;
  
  // Filter out custom props
  const domProps = { ...props };
  delete domProps.value;
  delete domProps.setValue;
  
  return <div {...domProps}>{children}</div>;
}
