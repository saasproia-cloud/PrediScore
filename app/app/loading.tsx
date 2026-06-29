export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="app-panel overflow-hidden rounded-lg p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="h-5 w-24 animate-pulse rounded-full bg-primary/[0.15]" />
            <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10 sm:w-72" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/[0.08]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 w-24 animate-pulse rounded-lg bg-white/[0.08]" />
            <div className="h-16 w-24 animate-pulse rounded-lg bg-white/[0.08]" />
            <div className="h-16 w-24 animate-pulse rounded-lg bg-white/[0.08]" />
          </div>
        </div>
      </div>
      <div className="app-panel rounded-lg p-5">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="grid gap-3">
          <div className="h-16 animate-pulse rounded-lg bg-white/[0.08]" />
          <div className="h-16 animate-pulse rounded-lg bg-white/[0.08]" />
          <div className="h-16 animate-pulse rounded-lg bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}
