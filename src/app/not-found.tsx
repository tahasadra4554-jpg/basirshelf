import Link from "next/link";
import { BookX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";

export default function NotFound() {
  return (
    <Container className="py-24">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <BookX className="size-7" />
        </span>
        <p className="num-latin mt-6 text-5xl font-extrabold tracking-tight text-primary">
          404
        </p>
        <h1 className="mt-3 text-xl font-bold">This shelf is empty</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The page you were looking for does not exist. The book may have been removed, or the address is wrong.
        </p>
        <Button asChild className="mx-auto mt-7">
          <Link href="/#books">Back to the library</Link>
        </Button>
      </div>
    </Container>
  );
}
