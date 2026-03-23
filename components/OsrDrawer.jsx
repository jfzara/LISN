"use client";

import { useState } from "react";
import { GLOSSARY } from "@/lib/glossary";

const ENTRIES = [
  { key: "D",          ...GLOSSARY.D },
  { key: "G",          ...GLOSSARY.G },
  { key: "S",          ...GLOSSARY.S },
  { key: "P",          ...GLOSSARY.P },
  { key: "resistance", ...GLOSSARY.resistance },
  { key: "basis",      ...GLOSSARY.basis },
];

export default function OsrDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-white/15 bg-black/80 px-4 py-2.5 text-[12px] uppercase tracking-widest text-white/50 backdrop-blur-sm hover:border-white/30 hover:text-white/80 transition"
      >
        Comprendre LISN
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0a0a] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl text-white/90 tracking-wide">Comprendre LISN</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-[12px] text-white/40 hover:text-white/70 transition"
              >
                Fermer
              </button>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-white/40 max-w-2xl">
              LISN ne mesure pas la beauté. Il mesure le degré de structuration contrainte
              d'une œuvre — la richesse objectivable des relations qu'elle conserve sous variation.
              Le score n'est pas un jugement de goût.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {ENTRIES.map(({ key, name, short, long }) => (
                <div key={key} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex flex-col gap-2">
                  <div className="font-serif text-base text-white/80">{name}</div>
                  <p className="text-[13px] text-white/55 leading-relaxed">{short}</p>
                  <p className="text-[12px] text-white/30 leading-relaxed whitespace-pre-line">{long}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/6 bg-black/30 p-4 text-center">
              <p className="text-[13px] text-white/35 italic">
                "But you can still like what you like."
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
