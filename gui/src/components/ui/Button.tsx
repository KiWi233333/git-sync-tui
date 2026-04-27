import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ variant = "secondary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={["ui-button", `ui-button--${variant}`, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
