"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BasirShelf] book render error:", error);
  }, [error]);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </span>

        <h1 className="mt-6 text-xl font-extrabold tracking-tight">
          This book could not be loaded
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {error.message || "Could not reach the database. Please try again."}
        </p>

        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw />
            Try again
          </Button>
          <Button asChild variant="outline">
            <a href="/#books">Library</a>
          </Button>
        </div>
      </div>
    </Container>
  );
}
