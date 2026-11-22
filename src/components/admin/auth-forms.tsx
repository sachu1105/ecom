"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePasswordAction, signInAction, type AuthFormState } from "@/lib/auth/actions";

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signInAction, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormError message={state?.error} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email}
          aria-invalid={!!state?.fieldErrors?.email}
        />
        {state?.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state?.fieldErrors?.password}
        />
        {state?.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password}</p>}
      </div>
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(changePasswordAction, undefined);
  return (
    <form action={action} className="space-y-5" noValidate>
      {forced && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          You signed in with a temporary password. Choose a new one to continue.
        </p>
      )}
      <FormError message={state?.error} />
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={12} />
        <p className="text-xs text-muted-foreground">At least 12 characters with upper- and lower-case letters and a number.</p>
        {state?.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
        {state?.fieldErrors?.confirm && <p className="text-xs text-destructive">{state.fieldErrors.confirm}</p>}
      </div>
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
