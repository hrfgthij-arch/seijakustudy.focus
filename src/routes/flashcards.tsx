import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  emptyCard,
  emptyDeck,
  scheduleCard,
  useStudyStore,
  type Deck,
  type Flashcard,
} from "@/lib/study-store";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — Seijaku Study" },
      { name: "description", content: "Review custom study flashcards with a simple spaced-repetition rhythm." },
      { property: "og:title", content: "Flashcards — Seijaku Study" },
      { property: "og:description", content: "Review custom study flashcards with a simple spaced-repetition rhythm." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FlashcardsPage,
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function FlashcardsPage() {
  const { decks, setDecks } = useStudyStore();
  const [selectedId, setSelectedId] = useState<string | null>(decks[0]?.id ?? null);
  const [showBack, setShowBack] = useState(false);
  const [draftFront, setDraftFront] = useState("");
  const [draftBack, setDraftBack] = useState("");

  const selected = decks.find((deck) => deck.id === selectedId) ?? decks[0] ?? null;
  const dueCards = useMemo(() => selected?.cards.filter((card) => card.due <= today()) ?? [], [selected]);
  const activeCard = dueCards[0] ?? selected?.cards[0] ?? null;

  function addDeck() {
    const deck = emptyDeck(`Deck ${decks.length + 1}`);
    setDecks((current) => [...current, deck]);
    setSelectedId(deck.id);
  }

  function addCard() {
    if (!selected) return;
    const card = emptyCard(draftFront.trim(), draftBack.trim());
    setDecks((current) => current.map((deck) => (deck.id === selected.id ? { ...deck, cards: [...deck.cards, card] } : deck)));
    setDraftFront("");
    setDraftBack("");
  }

  function rate(rating: "again" | "hard" | "good" | "easy") {
    if (!selected || !activeCard) return;
    const updated = scheduleCard(activeCard, rating);
    setDecks((current) => current.map((deck) =>
      deck.id === selected.id ? { ...deck, cards: deck.cards.map((card) => card.id === updated.id ? updated : card) } : deck,
    ));
    setShowBack(false);
  }

  return (
    <main className="study-page px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Memory garden</p>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Flashcards 🃏</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">Turn small review sessions into knowledge that stays with you.</p>
          </div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary">← Tracker</Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="study-panel rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-bold text-foreground">Your decks</span>
              <button onClick={addDeck} className="rounded-lg px-2 py-1 text-lg leading-none text-primary hover:bg-primary/10" aria-label="Add deck">+</button>
            </div>
            {decks.length === 0 ? <p className="px-2 py-5 text-xs text-muted-foreground">Create your first deck.</p> : (
              <div className="space-y-1">
                {decks.map((deck) => (
                  <button key={deck.id} onClick={() => { setSelectedId(deck.id); setShowBack(false); }} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold ${selected?.id === deck.id ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-[color:var(--muted)]"}`}>
                    <span>{deck.emoji}</span><span className="min-w-0 flex-1 truncate">{deck.name}</span><span className="text-[10px] opacity-70">{deck.cards.length}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="space-y-5">
            <div className="study-panel rounded-2xl p-5 md:p-7">
              {!selected ? <EmptyState onAdd={addDeck} /> : (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div><h2 className="text-lg font-bold text-foreground">{selected.emoji} {selected.name}</h2><p className="text-xs text-muted-foreground">{dueCards.length} due today · {selected.cards.length} total</p></div>
                    {activeCard && <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">Review time</span>}
                  </div>
                  {activeCard ? (
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)]/60 p-6 text-center md:p-10">
                      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{showBack ? "Answer" : "Prompt"}</p>
                      <p className="min-h-20 whitespace-pre-wrap text-xl font-semibold text-foreground">{showBack ? activeCard.back || "No answer added yet." : activeCard.front || "No prompt added yet."}</p>
                      <button onClick={() => setShowBack((value) => !value)} className="mt-6 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">{showBack ? "Show prompt" : "Reveal answer"}</button>
                      {showBack && <div className="mt-6 flex flex-wrap justify-center gap-2"><RateButton label="Again" onClick={() => rate("again")} /><RateButton label="Hard" onClick={() => rate("hard")} /><RateButton label="Good" onClick={() => rate("good")} /><RateButton label="Easy" onClick={() => rate("easy")} /></div>}
                    </div>
                  ) : <p className="rounded-xl border border-dashed border-[color:var(--border)] px-4 py-10 text-center text-sm text-muted-foreground">This deck is clear for now. Add another card below.</p>}
                </>
              )}
            </div>

            {selected && <div className="study-panel rounded-2xl p-5"><h2 className="mb-3 text-sm font-bold text-foreground">Add a card</h2><div className="grid gap-2 md:grid-cols-2"><textarea value={draftFront} onChange={(event) => setDraftFront(event.target.value)} placeholder="Prompt or question" className="min-h-24 resize-y rounded-xl border border-[color:var(--border)] bg-white/70 p-3 text-sm outline-none focus:border-primary" /><textarea value={draftBack} onChange={(event) => setDraftBack(event.target.value)} placeholder="Answer or notes" className="min-h-24 resize-y rounded-xl border border-[color:var(--border)] bg-white/70 p-3 text-sm outline-none focus:border-primary" /></div><button onClick={addCard} disabled={!draftFront.trim() && !draftBack.trim()} className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Add card</button></div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function RateButton({ label, onClick }: { label: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-full border border-[color:var(--border)] bg-white/80 px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary">{label}</button>; }
function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="py-8 text-center"><div className="mb-3 text-4xl">🌱</div><h2 className="text-lg font-bold text-foreground">Start a memory garden</h2><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Create a deck for vocabulary, formulas, names, or anything you want to remember.</p><button onClick={onAdd} className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Create deck</button></div>; }