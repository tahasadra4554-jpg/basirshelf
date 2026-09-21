"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { GraduationCap, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

import { getCurrentUserAction, signOutAction } from "@/lib/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function AuthButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [user, setUser] = useState<{
    email: string;
    name: string | null;
    role: string;
  } | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUserAction();
      setUser(u);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    // 1. Fetch current user on mount and whenever pathname changes
    void refreshUser();

    // 2. Listen to custom auth change events
    window.addEventListener("basirshelf:auth-change", refreshUser);

    if (!supabaseReady) return () => window.removeEventListener("basirshelf:auth-change", refreshUser);

    const supabase = getSupabaseBrowserClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        void refreshUser();
        return;
      }
      const meta = (session.user.user_metadata ?? {}) as {
        full_name?: string | null;
        role?: string | null;
      };
      setUser({
        email: session.user.email ?? "",
        name: meta.full_name ?? session.user.email ?? null,
        role: meta.role === "teacher" ? "teacher" : "student",
      });
    });

    return () => {
      window.removeEventListener("basirshelf:auth-change", refreshUser);
      subscription.unsubscribe();
    };
  }, [pathname, refreshUser]);

  function handleSignOut() {
    startTransition(async () => {
      const result = await signOutAction();
      if (result.ok) {
        toast.success(result.message ?? "Signed out.");
        setUser(null);
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.role === "teacher" ? (
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link href="/teacher">
              <ShieldCheck />
              Teacher panel
            </Link>
          </Button>
        ) : null}

        <span className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 shadow-soft sm:flex">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {initials(user.name)}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="max-w-[10rem] truncate text-xs font-semibold">
              {user.name}
            </span>
            <Badge
              variant={user.role === "teacher" ? "soft" : "secondary"}
              className="w-fit px-1.5 py-0 text-[10px]"
            >
              {user.role === "teacher" ? "Teacher" : "Student"}
            </Badge>
          </span>
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          disabled={pending}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
        <Link href="/login">
          <UserRound className="size-4" />
          Sign in
        </Link>
      </Button>
      <Button asChild size="sm" className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm">
        <Link href="/signup">
          <GraduationCap className="size-3.5 sm:size-4" />
          <span>Sign up</span>
        </Link>
      </Button>
    </div>
  );
}
