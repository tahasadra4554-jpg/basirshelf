"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { signOutAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signOutAction();
          if (result.ok) {
            toast.success(result.message ?? "Signed out.");
            router.push("/");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      <LogOut />
      Sign out
    </Button>
  );
}
