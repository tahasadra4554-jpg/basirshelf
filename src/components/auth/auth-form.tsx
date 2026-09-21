"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AuthField {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
}

export function AuthForm({
  action,
  fields,
  submitLabel,
  redirectTo = "/",
  notice,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  fields: AuthField[];
  submitLabel: string;
  redirectTo?: string;
  notice?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!state) return;
    const key = `${state.ok}:${state.ok ? (state.message ?? "") : state.error}`;
    if (handled.current === key) return;
    handled.current = key;

    if (state.ok) {
      toast.success(state.message ?? "Done.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("basirshelf:auth-change"));
        window.location.href = redirectTo;
      }
    } else {
      toast.error(state.error);
    }
  }, [state, redirectTo, router]);

  return (
    <form action={formAction} className="space-y-4">
      {notice ? (
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs leading-6 text-primary">
          {notice}
        </p>
      ) : null}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-[#FBBF24]">{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            dir={field.dir ?? (field.type === "email" ? "ltr" : "rtl")}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            required={field.required ?? true}
            className="text-start border-amber-500/30 bg-[#0A1628] text-[#FEF3C7] focus-visible:border-[#F59E0B]"
          />
        </div>
      ))}

      <Button type="submit" className="w-full btn-amber-primary" size="lg" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="animate-spin text-[#0A1628]" />
            Working…
          </>
        ) : (
          submitLabel
        )}
      </Button>

      <p className="text-center text-xs leading-6 text-[#FEF3C7]/70">
        Teachers sign in from the{" "}
        <Link
          href="/teacher-login"
          className="font-semibold text-[#FBBF24] hover:text-[#FCD34D] hover:underline"
        >
          dedicated teacher page
        </Link>
        .
      </p>
    </form>
  );
}
