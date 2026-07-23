import { useRef, useState } from "react";

type Props = {
  url: string | null;
  name: string | null;
  onChange: (url: string | null, name: string | null) => void;
  onClose: () => void;
};

export function PdfWidget({ url, name, onChange, onClose }: Props) {
  const [input, setInput] = useState(url ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result), f.name);
      setInput(String(reader.result));
    };
    reader.readAsDataURL(f);
  }

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-white/90 shadow-[var(--shadow-cute)] backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-4 py-3 md:px-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">📎 PDF viewer</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {name ? `Embedded: ${name}` : "Attach a PDF URL or upload a file to embed."}
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Hide widget</button>
      </div>
      <div className="space-y-3 p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a PDF URL…"
            className="flex-1 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => onChange(input || null, input ? (input.split("/").pop() ?? "PDF") : null)}
            className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Load URL
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:border-primary"
          >
            Upload PDF
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {url && (
            <button
              onClick={() => { onChange(null, null); setInput(""); }}
              className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-destructive hover:border-destructive"
            >
              Remove
            </button>
          )}
        </div>
        {url ? (
          <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--muted)]">
            <iframe
              title={name ?? "PDF"}
              src={url}
              className="h-[560px] w-full"
            />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-8 text-center text-xs text-muted-foreground">
            No PDF loaded yet.
          </p>
        )}
      </div>
    </section>
  );
}
