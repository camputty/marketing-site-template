import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function ButtonLink({ className = "", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      {...props}
    />
  );
}
