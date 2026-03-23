function pct(x) {
  return `${Math.round((Number(x) || 0) * 100)}%`;
}

function Bar({ label, value }) {
  const pctVal = Math.round((Number(value) || 0) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] text-white/50">{label}</span>
        <span className="text-[12px] text-white/35">{pctVal}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/8">
        <div
          className="h-1 rounded-full bg-white/50 transition-all duration-700"
          style={{ width: `${pctVal}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfileCard({ profile }) {
  if (!profile) return null;
  const confidence = Math.round((profile.profileConfidence || 0) * 100);

  return (
    <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg text-white/90 tracking-wide">Ton profil LISN</h3>
          <p className="mt-1 text-sm text-white/40">
            Construit à partir de tes analyses et réactions.
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/35">Confiance</div>
          <div className="text-lg font-serif text-white/70 leading-none mt-0.5">{confidence}%</div>
        </div>
      </div>

      {profile.explanatorySummary && (
        <p className="text-[14px] leading-relaxed text-white/60 border-l border-white/10 pl-4">
          {profile.explanatorySummary}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-white/6 bg-black/20 p-4 flex flex-col gap-3">
          <div className="text-[10px] uppercase tracking-widest text-white/30">
            Affinités de dimension
          </div>
          <Bar label="Densité"     value={profile.dimensionAffinity?.D} />
          <Bar label="Grain"       value={profile.dimensionAffinity?.G} />
          <Bar label="Singularité" value={profile.dimensionAffinity?.S} />
          <Bar label="Profondeur"  value={profile.dimensionAffinity?.P} />
        </div>

        <div className="rounded-xl border border-white/6 bg-black/20 p-4 flex flex-col gap-3">
          <div className="text-[10px] uppercase tracking-widest text-white/30">
            Préférences transversales
          </div>
          <Bar label="Tolérance à la résistance" value={profile.resistanceTolerance} />
          <Bar label="Goût de la nouveauté"      value={profile.noveltyPreference} />
          <Bar label="Recherche de validation"   value={profile.validationPreference} />
          <Bar label="Ouverture au challenge"    value={profile.challengePreference} />
        </div>
      </div>

      <div className="text-[11px] text-white/25">
        {profile.evidenceCount || 0} analyse{profile.evidenceCount > 1 ? "s" : ""} prise{profile.evidenceCount > 1 ? "s" : ""} en compte
      </div>
    </section>
  );
}
