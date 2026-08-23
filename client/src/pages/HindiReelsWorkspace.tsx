import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Clapperboard, RefreshCw, ShieldCheck } from "lucide-react";

const statusStyles: Record<string, string> = {
  research_ready: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
  script_ready: "border-indigo-500/30 bg-indigo-500/10 text-indigo-100",
  media_blocked: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  qc_pending: "border-violet-500/30 bg-violet-500/10 text-violet-100",
  qc_passed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  uploaded: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-100",
};

export default function HindiReelsWorkspace() {
  const { user } = useAuth();
  const catalogQuery = trpc.agentHub.getReelCatalog.useQuery(undefined, {
    enabled: !!user,
  });
  const productionQuery = trpc.agentHub.getReelProductionStatus.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900">
          <CardContent className="space-y-4 p-6 text-sm text-slate-400">
            <p>Sign in to view your private Hindi research reels catalog.</p>
            <Button
              asChild
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              <a href="#/">Return to Agent Hub</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const status = productionQuery.data;
  const isLoading = catalogQuery.isLoading || productionQuery.isLoading;
  const hasError = catalogQuery.isError || productionQuery.isError;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <Clapperboard className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                Private production catalog
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                Hindi research reels
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Owner-scoped editorial records only. This workspace cannot
                generate media, write to Drive, or bootstrap production records.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200"
            >
              <a href="#/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Agent Hub
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-indigo-500/30 bg-indigo-500/10 text-indigo-100"
              onClick={() => {
                void catalogQuery.refetch();
                void productionQuery.refetch();
              }}
              disabled={catalogQuery.isFetching || productionQuery.isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        {hasError && (
          <div
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100"
            role="alert"
          >
            Your private catalog is temporarily unavailable. No production
            action has been performed.
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Target", status?.targetReels ?? "—"],
            ["Research / script ready", status?.researchReadyReels ?? "—"],
            ["Media blocked", status?.mediaBlockedReels ?? "—"],
            ["Queued retries", status?.retryQueuedReels ?? "—"],
          ].map(([label, value]) => (
            <Card key={label} className="border-slate-800 bg-slate-900/80">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {status?.currentCapacityBoundary && (
          <p className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {status.currentCapacityBoundary}
          </p>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-slate-100">
              Your catalog records
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Evidence labels distinguish research certainty; a status is never
              inferred as a completed delivery.
            </p>
          </div>
          {isLoading ? (
            <div className="p-6 text-sm text-slate-400">
              Loading private catalog records…
            </div>
          ) : catalogQuery.data?.length ? (
            <div className="divide-y divide-slate-800">
              {catalogQuery.data.map(reel => (
                <article
                  key={reel.id}
                  className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-start"
                >
                  <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-xs text-slate-100">
                    REEL {String(reel.reelNumber).padStart(4, "0")}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-100">{reel.title}</h3>
                    <p className="mt-1 text-xs text-indigo-200">{reel.topic}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {reel.evidenceSummary}
                    </p>
                    {reel.lastBlocker && (
                      <p className="mt-3 text-xs text-amber-100">
                        Current boundary: {reel.lastBlocker}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge
                      variant="outline"
                      className={
                        statusStyles[reel.status] ?? "border-slate-700"
                      }
                    >
                      {reel.status.replaceAll("_", " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-slate-950 text-slate-300"
                    >
                      {reel.evidenceClass.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              No private reel records yet. Catalog bootstrap is intentionally
              limited to authorized administrators.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
