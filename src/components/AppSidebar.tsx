import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { emptyPage, useStudyStore } from "@/lib/study-store";

export type NavItem = { to: string; label: string; emoji: string };

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Tracker", emoji: "🌿" },
  { to: "/planner", label: "Planner", emoji: "🗓" },
  { to: "/progress", label: "Progress", emoji: "📈" },
  { to: "/flashcards", label: "Flashcards", emoji: "🃏" },
  { to: "/grades", label: "Grades", emoji: "🎯" },
  { to: "/deadlines", label: "Deadlines", emoji: "⏳" },
  { to: "/todo", label: "To-do", emoji: "📝" },
  { to: "/sleep", label: "Sleep", emoji: "🌙" },
  { to: "/links", label: "Links", emoji: "🔗" },
  { to: "/settings", label: "Settings", emoji: "⚙️" },
];

function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${iso}T00:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** Lessons with a due date inside the next week (or overdue) and not finished. */
export function useDueSoonCount() {
  const { rows } = useStudyStore();
  return useMemo(
    () => rows.filter((r) => r.dueDate && r.status !== "done" && daysUntil(r.dueDate) <= 7).length,
    [rows],
  );
}

export function AppSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const { pages, setPages, hydrated } = useStudyStore();
  const navigate = useNavigate();
  const dueSoon = useDueSoonCount();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pagesOpen, setPagesOpen] = useState(true);

  useEffect(() => {
    if (pathname.startsWith("/pages")) setPagesOpen(true);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const favorites = hydrated ? pages.filter((p) => p.favorite) : [];
  const listed = hydrated ? pages.slice(0, 12) : [];

  function newPage() {
    const p = emptyPage();
    setPages((list) => [p, ...list]);
    navigate({ to: "/pages/$pageId", params: { pageId: p.id } });
  }

  const width = collapsed ? "4.25rem" : "15rem";

  const body = (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-2 py-3">
      <div className={`mb-1 flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1`}>
        {!collapsed && (
          <Link to="/" className="truncate text-sm font-bold text-primary">
            🌿 Seijaku
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden h-7 w-7 items-center justify-center rounded-lg text-xs text-muted-foreground hover:bg-[color:var(--muted)] hover:text-primary lg:inline-flex"
        >
          {collapsed ? "»" : "«"}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs text-muted-foreground hover:text-primary lg:hidden"
        >
          ✕
        </button>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-[color:var(--muted)] hover:text-foreground"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            <span className="text-base leading-none">{item.emoji}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.to === "/deadlines" && dueSoon > 0 && (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {dueSoon}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-2 border-t border-[color:var(--border)] pt-2">
        <div className={`flex items-center gap-1 ${collapsed ? "justify-center" : ""}`}>
          <button
            onClick={() => (collapsed ? setCollapsed(false) : setPagesOpen((v) => !v))}
            className={`flex flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-[color:var(--muted)] hover:text-foreground ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <span className="text-base leading-none">📄</span>
            {!collapsed && (
              <>
                <span className="truncate">Pages</span>
                <span className="ml-auto text-[10px]">{pagesOpen ? "▾" : "▸"}</span>
              </>
            )}
          </button>
        </div>

        {!collapsed && pagesOpen && (
          <div className="mt-0.5 space-y-0.5 pl-2">
            {favorites.length > 0 && (
              <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Pinned</p>
            )}
            {favorites.map((p) => (
              <Link
                key={`fav-${p.id}`}
                to="/pages/$pageId"
                params={{ pageId: p.id }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-[color:var(--muted)] hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <span>{p.icon}</span>
                <span className="truncate">{p.title || "Untitled"}</span>
              </Link>
            ))}
            {listed.length > 0 && favorites.length > 0 && (
              <p className="px-2 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">All</p>
            )}
            {listed.map((p) => (
              <Link
                key={p.id}
                to="/pages/$pageId"
                params={{ pageId: p.id }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-[color:var(--muted)] hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <span>{p.icon}</span>
                <span className="truncate">{p.title || "Untitled"}</span>
              </Link>
            ))}
            <button
              onClick={newPage}
              className="mt-0.5 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-primary hover:bg-primary/10"
            >
              + New page
            </button>
            <Link
              to="/pages"
              className="block rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              All pages →
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        style={{ width }}
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-[color:var(--border)] bg-white/85 backdrop-blur transition-[width] duration-200 lg:block"
      >
        {body}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 animate-veil-in" onClick={() => setMobileOpen(false)} />
          <div
            style={{ width: "15rem" }}
            className="absolute inset-y-0 left-0 border-r border-[color:var(--border)] bg-white shadow-xl animate-sheet-up"
          >
            {body}
          </div>
        </div>
      )}
    </>
  );
}
