import { useMemo, useState } from "react";

type Props = {
  url: string | null;
  onChange: (url: string | null) => void;
  onHide: () => void;
};

/**
 * Lightweight Spotify player using the official embed iframe.
 * Users paste any spotify.com share link (playlist / album / track / episode);
 * the iframe uses their existing Spotify browser session for full playback.
 */
function toEmbedUrl(raw: string | null): string | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  // Full <iframe …> embed code pasted from Spotify's "Copy embed code"
  const iframeSrc = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeSrc) trimmed = iframeSrc[1];
  // Already an embed URL
  if (trimmed.includes("open.spotify.com/embed/")) return trimmed;
  // spotify:track:xxx URI
  const uri = trimmed.match(/^spotify:([a-z]+):([a-zA-Z0-9]+)/);
  if (uri) return `https://open.spotify.com/embed/${uri[1]}/${uri[2]}`;
  // https URL: extract /{kind}/{id}
  const m = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([a-zA-Z0-9]+)/);
  if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`;
  // Bare "playlist 37i9..." or "kind/id" shorthand
  const kind = trimmed.match(/^(track|album|playlist|episode|show|artist)[\s/:]+([a-zA-Z0-9]{16,})/i);
  if (kind) return `https://open.spotify.com/embed/${kind[1].toLowerCase()}/${kind[2]}`;
  // Bare 22-char Spotify ID — assume a playlist
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return `https://open.spotify.com/embed/playlist/${trimmed}`;
  return null;
}

export function SpotifyPlayer({ url, onChange, onHide }: Props) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const embed = useMemo(() => toEmbedUrl(url), [url]);
  const showForm = editing || !embed;

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white/85 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎧</span>
          <h2 className="text-sm font-bold text-foreground">Spotify Player</h2>
        </div>
        <div className="flex items-center gap-2">
          {embed && (
            <button
              onClick={() => {
                setDraft("");
                setEditing((v) => !v);
              }}
              className="text-[11px] font-semibold text-muted-foreground hover:text-primary"
            >
              {editing ? "Done" : "Change"}
            </button>
          )}
          <button onClick={onHide} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Hide
          </button>
        </div>
      </div>
      <div className="p-3">
        {showForm && (
          <div className="mb-2 flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={1}
              placeholder="Paste a Spotify link, URI or <iframe> embed code…"
              className="min-w-0 flex-1 resize-none rounded-md border border-[color:var(--border)] bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => {
                onChange(draft.trim() || null);
                setDraft("");
                setEditing(false);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Load
            </button>
            {url && (
              <button
                onClick={() => {
                  setDraft("");
                  onChange(null);
                  setEditing(false);
                }}
                className="rounded-md border border-[color:var(--border)] bg-white px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {embed ? (
          <iframe
            key={embed}
            src={embed}
            title="Spotify player"
            width="100%"
            height={352}
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-white/50 p-6 text-center text-xs text-muted-foreground">
            Paste any share link or embed code from Spotify to load your playlist.
            <br />
            Sign in on{" "}
            <a href="https://open.spotify.com" target="_blank" rel="noreferrer" className="text-primary underline">
              open.spotify.com
            </a>{" "}
            first for full track playback.
          </div>
        )}
      </div>
    </section>
  );
}
