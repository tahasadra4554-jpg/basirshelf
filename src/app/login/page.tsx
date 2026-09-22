import type { Metadata } from "next";
import Link from "next/link";

import { studentLoginAction } from "@/lib/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Student sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to your student account"
      subtitle="Use the email and password you created when you signed up."
      highlights={[
        "Access to the video and handout of every Interchange and Connect book",
        "Your learning path saved to your account",
        "Fast sign-in with email and password",
      ]}
      footer={
        <p className="text-center text-sm text-[#FEF3C7]/80">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[#FBBF24] hover:text-[#FCD34D] hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <AuthForm
        action={studentLoginAction}
        submitLabel="Sign in"
        redirectTo="/"
        fields={[
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
            placeholder: "••••••••",
            autoComplete: "current-password",
            dir: "ltr",
          },
        ]}
      />
    </AuthShell>
  );
}
