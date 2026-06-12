import type { ComponentPropsWithoutRef } from "react";

type HeadingProps = ComponentPropsWithoutRef<"h2"> & {
  as?: "h1" | "h2" | "h3";
};

export function Heading({
  as,
  className = "",
  ...props
}: HeadingProps) {
  const Component = as ?? "h2";
  return (
    <Component
      className={`text-balance font-semibold tracking-tight ${className}`}
      {...props}
    />
  );
}
