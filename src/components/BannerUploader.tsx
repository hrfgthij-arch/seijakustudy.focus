import { useRef, useState } from "react";

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
  onClose: () => void;
};

export function BannerUploader({ value, onChange, onClose }: Props) {
  const [url, setUrl] = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      onChange(dataUrl);
      setUrl(dataUrl);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white/95 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">🖼️ Header banner</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste image URL…"
          className="flex-1 rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => onChange(url || null)}
          className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Use URL
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:border-primary"
        >
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {value && (
          <button
            onClick={() => { onChange(null); setUrl(""); }}
            className="rounded-md border border-[color:var(--border)] bg-white px-3 py-2 text-xs font-semibold text-destructive hover:border-destructive"
          >
            Remove
          </button>
        )}
      </div>
      {value && (
        <div className="mt-3 overflow-hidden rounded-lg border border-[color:var(--border)]">
          <img src={value} alt="Banner preview" className="max-h-32 w-full object-cover" />
        </div>
      )}
    </div>
  );
}
