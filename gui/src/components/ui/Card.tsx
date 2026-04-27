import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <article className={["ui-card", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </article>
  );
}
