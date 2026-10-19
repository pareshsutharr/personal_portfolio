/** Minimal route-transition indicator: a thin ember line, nothing else. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-h-[60svh]">
      <span className="sr-only">Loading</span>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px animate-pulse bg-ember-500/70"
      />
    </div>
  );
}
