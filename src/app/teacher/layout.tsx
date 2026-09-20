import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/site/container";

export const metadata: Metadata = {
  title: "Teacher panel",
  robots: { index: false, follow: false },
};

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "teacher") {
    return (
      <Container className="py-20">
        <Card className="mx-auto max-w-md p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold">Restricted access</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            This area is for Basir teachers only. Sign in with a teacher account to manage the books.
          </p>
          <Button asChild className="mx-auto mt-6">
            <a href="/teacher-login">Teacher sign in</a>
          </Button>
        </Card>
      </Container>
    );
  }

  return <>{children}</>;
}
