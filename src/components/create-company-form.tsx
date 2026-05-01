"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createCompanyAction } from "@/actions/pipeline";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Add company
    </Button>
  );
}

export function CreateCompanyForm() {
  const ref = useRef<HTMLFormElement>(null);

  async function handle(formData: FormData) {
    try {
      const row = await createCompanyAction(formData);
      const created = row as { name?: string } | undefined;
      toast.success(`Added ${created?.name ?? "company"}`);
      ref.current?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <form ref={ref} action={handle} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Acme Co" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" placeholder="sportswear" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" name="domain" placeholder="acme.com" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
