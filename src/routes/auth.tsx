import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Seijaku Study" },
      { name: "description", content: "Sign in to sync your Seijaku Study study tracker across devices." },
      { property: "og:title", content: "Sign in — Seijaku Study" },
      { property: "og:description", content: "Sign in to sync your Seijaku Study study tracker across devices." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) nav({ to: "/" });
    });
  }, [nav]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg("Account created! Check your email if confirmation is required.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg("Magic link sent — check your email.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setErr(null);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) throw res.error;
      if (!res.redirected) nav({ to: "/" });
    } catch (e: any) {
      setErr(e?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-white/95 p-6 shadow-[var(--shadow-cute)] backdrop-blur">
        <Link to="/" className="mb-4 inline-block text-xs font-semibold text-muted-foreground hover:text-primary">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Welcome to Seijaku Study 🌸</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to sync your tracker across every device. You can also keep studying as a guest.
        </p>

        <div className="mt-5 flex gap-1 rounded-lg bg-[color:var(--muted)] p-1">
          {(["signin", "signup", "magic"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErr(null);
                setMsg(null);
              }}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                mode === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "signin" ? "Sign in" : m === "signup" ? "Sign up" : "Magic link"}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmail} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          {mode !== "magic" && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cute)] hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-[color:var(--border)]" /> or <span className="h-px flex-1 bg-[color:var(--border)]" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full rounded-md border border-[color:var(--border)] bg-white px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-60"
        >
          Continue with Google
        </button>

        {msg && <p className="mt-4 rounded-md bg-[color:var(--muted)] px-3 py-2 text-xs text-foreground">{msg}</p>}
        {err && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
      </div>
    </main>
  );
}
