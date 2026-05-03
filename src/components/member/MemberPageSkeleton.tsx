/** Skeletons légers pour l’espace membre (accessibilité : aria-busy). */

export function MemberPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Chargement du contenu">
      <div className="h-9 max-w-[220px] rounded-[2px] bg-black/[0.06]" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-[2px] bg-black/[0.05]" />
        ))}
      </div>
    </div>
  );
}

export function MemberDashboardKpiSkeleton() {
  return (
    <div
      className="col-span-1 md:col-span-12 grid grid-cols-1 gap-[18px] md:grid-cols-12 animate-pulse"
      aria-busy="true"
      aria-label="Chargement des indicateurs"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="col-span-1 md:col-span-3 h-[118px] rounded-[2px] bg-black/[0.06]"
        />
      ))}
    </div>
  );
}
