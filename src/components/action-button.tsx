"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "./ui/button";

type Props = Omit<ButtonProps, "onClick"> & {
  action: () => Promise<unknown>;
  successMessage?: string | ((result: unknown) => string);
};

function summarize(result: unknown): string {
  if (result == null) return "Done";
  if (typeof result === "object") {
    const entries = Object.entries(result as Record<string, unknown>)
      .filter(([, v]) => typeof v === "number" || typeof v === "string" || v === null)
      .slice(0, 4);
    if (entries.length === 0) return "Done";
    return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
  }
  return String(result);
}

export function ActionButton({ action, successMessage, children, ...props }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      {...props}
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            const result = await action();
            const msg =
              typeof successMessage === "function"
                ? successMessage(result)
                : successMessage ?? summarize(result);
            toast.success(msg);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed");
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
