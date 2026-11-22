"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/types";

/** Runs a Server Action with pending state, toasts, and a refresh of server data. */
export function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: { success?: string; refresh?: boolean; onSuccess?: (data: T | undefined) => void } = {},
  ) {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        const message = opts.success ?? result.message;
        if (message) toast.success(message);
        opts.onSuccess?.(result.data);
        if (opts.refresh !== false) router.refresh();
      } catch (e) {
        // redirect() from requireAdmin surfaces as a navigation, not an error.
        if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw e;
        }
        toast.error("Something went wrong. Please try again.");
      }
    });
  }

  return { run, pending };
}
