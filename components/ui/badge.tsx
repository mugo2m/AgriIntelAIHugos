import * as React from "react";

export function Badge({ children, variant = "default", className = "", ...props }: any) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

  let variantClasses = "bg-blue-100 text-blue-800";
  if (variant === "secondary") variantClasses = "bg-gray-100 text-gray-800";
  if (variant === "destructive") variantClasses = "bg-red-100 text-red-800";
  if (variant === "outline") variantClasses = "border border-gray-300 bg-white";

  const fullClassName = baseClasses + " " + variantClasses + " " + className;

  return (
    <span className={fullClassName} {...props}>
      {children}
    </span>
  );
}