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
import { useStudyStore } from "@/lib/study-store";


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
      { title: "Sakura Study — Cute Anime Study Tracker" },
      { name: "description", content: "A kawaii study tracker with anime and Genshin stickers to keep your lessons organized and synced across devices." },
      { property: "og:title", content: "Sakura Study — Cute Anime Study Tracker" },
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
    <nav className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[color:var(--border)] bg-white/80 px-4 py-2 backdrop-blur md:px-6">
      <div className="flex items-center gap-3 text-xs font-semibold">
        <Link to="/" className="text-sm font-bold text-primary">🌸 Sakura</Link>
        <Link to="/planner" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>Planner</Link>
        <Link to="/progress" className="text-muted-foreground hover:text-primary" activeProps={{ className: "text-primary" }}>Progress</Link>
        <Link to="/todo" className="text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>To-do</Link>
        <Link to="/links" className="text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>Links</Link>
        <Link to="/sleep" className="text-muted-foreground hover:text-primary md:hidden" activeProps={{ className: "text-primary" }}>Sleep</Link>
      </div>
      <div className="flex items-center gap-2 text-xs">
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
