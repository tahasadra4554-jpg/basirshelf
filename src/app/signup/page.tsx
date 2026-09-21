import type { Metadata } from "next";
import Link from "next/link";

import { studentSignUpAction } from "@/lib/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Student sign up" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your student account"
      subtitle="Set up an account in under a minute and get access to the whole shelf."
      highlights={[
        "New accounts default to the student role",
        "Password must be at least 6 characters",
        "No card or payment required",
      ]}
      footer={
        <p className="text-center text-sm text-[#FEF3C7]/80">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#FBBF24] hover:text-[#FCD34D] hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthForm
        action={studentSignUpAction}
        submitLabel="Create account"
        redirectTo="/"
        notice="New accounts are created automatically with the student role."
        fields={[
          {
            name: "full_name",
            label: "Full name",
            type: "text",
            placeholder: "e.g. Sara Mohammadi",
            autoComplete: "name",
            dir: "rtl",
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "student@example.com",
            autoComplete: "email",
            dir: "ltr",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "At least 6 characters",
            autoComplete: "new-password",
            dir: "ltr",
          },
        ]}
      />
    </AuthShell>
  );
}
