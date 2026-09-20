import type { Metadata } from "next";
import { KeyRound, ShieldCheck } from "lucide-react";

import { teacherLoginAction } from "@/lib/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Teacher sign in",
  robots: { index: false, follow: false },
};

export default function TeacherLoginPage() {
  return (
    <AuthShell
      title="Teacher sign in"
      subtitle="This page is for Basir teachers only. It uses a username and password."
      highlights={[
        "Manage the books and units you teach",
        "Attach a YouTube or Aparat video to any unit",
        "Upload PDF handouts to secure cloud storage",
      ]}
    >
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <p className="text-xs leading-6 text-primary">
          Teacher access: once you sign in, your account role is set to
          <span className="font-bold"> teacher </span>
          and you are taken to the dashboard.
        </p>
      </div>

      <AuthForm
        action={teacherLoginAction}
        submitLabel="Sign in to the teacher panel"
        redirectTo="/teacher"
        fields={[
          {
            name: "username",
            label: "Username",
            type: "text",
            placeholder: "teacher1_xxx",
            autoComplete: "username",
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

      <p className="mt-5 flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-[11px] leading-6 text-muted-foreground">
        <KeyRound className="mt-0.5 size-3.5 shrink-0" />
        Usernames and passwords are issued by the institute office. If you forget yours, contact the Basir office.
      </p>
    </AuthShell>
  );
}
