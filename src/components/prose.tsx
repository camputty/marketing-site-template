import type { ComponentPropsWithoutRef } from "react";

type ProseProps = ComponentPropsWithoutRef<"div">;

export function Prose({ className = "", ...props }: ProseProps) {
  return <div className={`prose ${className}`} {...props} />;
}
