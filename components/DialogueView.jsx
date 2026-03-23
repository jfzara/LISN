"use client";

import { useState } from "react";
import { BasisBadge, ConfidenceBadge } from "./Badges";

export default function DialogueView({ analysis }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/discuss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur discussion");
      setAnswer(data);
    } catch {
      setAnswer({ answer: "Impossible de répondre pour le moment.", basisUsed: [], confidence: "BASSE" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-serif text-lg text-white/90 tracking-wide">Discussion</h3>
        <p className="mt-1 text-sm text-white/40">Pose une question à LISN sur cette analyse.</p>
      </div>

      <form onSubmit={handleAsk} className="flex flex-col gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex. Pourquoi la densité est-elle élevée ici ?"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 transition"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="self-start rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-40 transition hover:bg-white/90"
        >
          {loading ? "Réflexion…" : "Demander"}
        </button>
      </form>

      {answer && (
        <div className="rounded-xl border border-white/8 bg-black/20 p-4 flex flex-col gap-3">
          <p className="text-[15px] leading-relaxed text-white/75">{answer.answer}</p>
          <div className="flex flex-wrap gap-1.5">
            {answer.basisUsed?.map((b, i) => <BasisBadge key={i} value={b} />)}
            <ConfidenceBadge value={answer.confidence} />
          </div>
        </div>
      )}
    </section>
  );
}
