import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useStudyStore, THEMES, type ThemeId } from "@/lib/study-store";


import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Seijaku Study — Cute Anime Study Tracker" },
      { name: "description", content: "A kawaii study tracker with anime and Genshin stickers to keep your lessons organized and synced across devices." },
      { property: "og:title", content: "Seijaku Study — Cute Anime Study Tracker" },
      { property: "og:description", content: "A kawaii study tracker with anime and Genshin stickers to keep your lessons organized and synced across devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemePicker() {
  const { settings, setSettings, hydrated } = useStudyStore();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === settings.theme) ?? THEMES[0];

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme, hydrated]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        title="Change theme"
        className="inline-flex h-8 items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
      >
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: current.swatch }} />
        <span className="hidden sm:inline">{current.emoji}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white p-1 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSettings({ ...settings, theme: t.id as ThemeId });
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-[color:var(--muted)] ${
                t.id === settings.theme ? "text-primary" : "text-foreground"
              }`}
            >
              <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: t.swatch }} />
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBar() {
  const [signedIn, setSignedIn] = useState(false);
  const { settings, setSettings } = useStudyStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  function saveName() {
    setSettings({ ...settings, displayName: draft.trim() || null });
    setEditing(false);
  }

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-[color:var(--border)] bg-white/80 px-3 py-2 backdrop-blur md:gap-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto text-xs font-semibold [scrollbar-width:none] md:gap-3">
        <Link to="/" className="shrink-0 text-sm font-bold text-primary">🌿 Seijaku</Link>
        <Link to="/planner" className="shrink-0 text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>Planner</Link>
        <Link to="/progress" className="shrink-0 text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>Progress</Link>
        <Link to="/todo" className="shrink-0 text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>To-do</Link>
        <Link to="/links" className="shrink-0 text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>Links</Link>
        <Link to="/sleep" className="shrink-0 text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>Sleep</Link>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        <ThemePicker />
        {signedIn ? (
          <>
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditing(false);
                }}
                placeholder="Your name"
                className="w-28 rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs outline-none focus:border-primary"
              />
            ) : (
              <button
                onClick={() => {
                  setDraft(settings.displayName ?? "");
                  setEditing(true);
                }}
                className="max-w-[160px] truncate rounded-md px-1.5 py-1 font-semibold text-muted-foreground hover:text-primary"
                title="Set the name shown here"
              >
                {settings.displayName || "+ Add name"}
              </button>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1 font-semibold text-muted-foreground hover:border-primary hover:text-primary"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/auth" className="rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground hover:opacity-90">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <NavBar />
      <Outlet />
    </QueryClientProvider>
  );
}
