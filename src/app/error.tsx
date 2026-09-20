"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure in the console too, so it is not silently swallowed.
    console.error("[BasirShelf] render error:", error);
  }, [error]);

  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </span>

        <h1 className="mt-6 text-xl font-extrabold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          This page failed to load. The database connection may be down. Please try again.
        </p>

        {error.message ? (
          <p
            dir="ltr"
            className="mx-auto mt-5 max-w-sm truncate rounded-xl border border-border bg-muted px-3 py-2 text-start text-[11px] text-muted-foreground"
            title={error.message}
          >
            {error.message}
          </p>
        ) : null}

        {error.digest ? (
          <p className="num-latin mt-2 text-[11px] text-muted-foreground">
            Error ID: {error.digest}
          </p>
        ) : null}

        <div className="mt-7 flex justify-center gap-3">
          <Button onClick={reset}>
            <RefreshCw />
            Try again
          </Button>
          <Button asChild variant="outline">
            <a href="/">Back to home</a>
          </Button>
        </div>
      </div>
    </Container>
  );
}
