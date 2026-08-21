import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  Copy,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function FacebookProfileWorkspace() {
  const [bio, setBio] = useState("");
  const [fact, setFact] = useState({
    category: "Education",
    title: "",
    details: "",
    source: "",
  });
  const [skill, setSkill] = useState({ name: "", category: "Technical" });
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();
  const query = trpc.facebookProfile.getProfile.useQuery(undefined);
  const data = query.data;
  const hasEvidence = (data?.facts.length ?? 0) > 0;
  const pendingActions = hasEvidence
    ? (data?.actions.filter(item => item.status === "pending_approval") ?? [])
    : [];
  const approvedActions = hasEvidence
    ? (data?.actions.filter(item => item.status === "approved") ?? [])
    : [];
  const refresh = () => utils.facebookProfile.getProfile.invalidate();
  const saveBio = trpc.facebookProfile.updateBio.useMutation({
    onSuccess: refresh,
  });
  const requestApproval = trpc.facebookProfile.requestBioApproval.useMutation({
    onSuccess: refresh,
  });
  const approve = trpc.facebookProfile.approveAction.useMutation({
    onSuccess: refresh,
  });
  const addFact = trpc.facebookProfile.addVerifiedFact.useMutation({
    onSuccess: refresh,
  });
  const addSkill = trpc.facebookProfile.addSkill.useMutation({
    onSuccess: refresh,
  });
  const visibleBio =
    bio || (hasEvidence ? data?.profile.proposedBio || "" : "");

  const exportText = useMemo(
    () =>
      [
        "FACEBOOK PROFILE — APPROVED EXPORT",
        "",
        "Apply only in Facebook manually after completing login, CAPTCHA, and 2FA.",
        "",
        "APPROVED BIO",
        approvedActions.find(item => item.actionType === "bio_update")
          ?.proposedContent || "No approved bio change.",
        "",
        "VERIFIED FACTS",
        data?.facts.length
          ? data.facts
              .map(item => `• ${item.factTitle}: ${item.factDetails}`)
              .join("\n")
          : "No verified facts recorded.",
        "",
        "SKILLS",
        data?.skills.length
          ? data.skills
              .map(
                item => `• ${item.skillName} (${item.category || "General"})`
              )
              .join("\n")
          : "No skills recorded.",
      ].join("\n"),
    [approvedActions, data]
  );

  if (query.isLoading)
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
        Loading secure workspace…
      </main>
    );
  if (query.error)
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
        Sign in to AI Agent Hub to use this private workspace.
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900 px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              Facebook Profile Professional Optimizer
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Evidence-first drafting, approval gates, and manual application
              guidance.
            </p>
          </div>
          <Link href="/" className="text-sm text-cyan-300">
            Back to AI Agent Hub
          </Link>
        </div>
      </header>

      <div className="border-b border-amber-400/20 bg-amber-400/10 px-5 py-3 text-sm text-amber-100">
        <div className="mx-auto flex max-w-6xl gap-3">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          <p>
            Facebook passwords, CAPTCHA answers, 2FA, privacy changes, and final
            publishing must be completed manually. This app does not access your
            Facebook account.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Professional bio draft</h2>
          <p className="mt-1 text-sm text-slate-400">
            Use only facts you can support with evidence.
          </p>
          <Textarea
            className="mt-4 min-h-36 bg-slate-950"
            value={visibleBio}
            onChange={event => setBio(event.target.value)}
            placeholder="Write an accurate professional bio based on verified facts."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              disabled={!visibleBio.trim() || saveBio.isPending}
              onClick={() => saveBio.mutate({ proposedBio: visibleBio })}
            >
              Save draft
            </Button>
            <Button
              variant="outline"
              disabled={
                !hasEvidence ||
                !data?.profile.proposedBio ||
                requestApproval.isPending
              }
              onClick={() => requestApproval.mutate()}
            >
              Request approval
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            Safety status
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Verified facts</dt>
              <dd>{data?.facts.length ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Approved actions</dt>
              <dd>{approvedActions.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Workspace state</dt>
              <dd className="text-cyan-200">
                {hasEvidence ? "ready for review" : "evidence needed"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-slate-300">
            Unverified legacy records are excluded. Only actions created after
            verified evidence can be approved or exported.
          </p>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Verified facts and skills</h2>
          <form
            className="mt-4 grid gap-3"
            onSubmit={event => {
              event.preventDefault();
              addFact.mutate(
                {
                  factCategory: fact.category,
                  factTitle: fact.title,
                  factDetails: fact.details,
                  sourceDocument: fact.source || undefined,
                },
                {
                  onSuccess: () =>
                    setFact({
                      category: "Education",
                      title: "",
                      details: "",
                      source: "",
                    }),
                }
              );
            }}
          >
            <Input
              className="bg-slate-950"
              value={fact.category}
              onChange={event =>
                setFact({ ...fact, category: event.target.value })
              }
              placeholder="Fact category"
            />
            <Input
              className="bg-slate-950"
              value={fact.title}
              onChange={event =>
                setFact({ ...fact, title: event.target.value })
              }
              placeholder="Verified title"
              required
            />
            <Textarea
              className="bg-slate-950"
              value={fact.details}
              onChange={event =>
                setFact({ ...fact, details: event.target.value })
              }
              placeholder="Evidence-backed details"
              required
            />
            <Input
              className="bg-slate-950"
              value={fact.source}
              onChange={event =>
                setFact({ ...fact, source: event.target.value })
              }
              placeholder="Evidence source (optional)"
            />
            <Button disabled={addFact.isPending}>Add verified fact</Button>
          </form>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={event => {
              event.preventDefault();
              addSkill.mutate(
                { skillName: skill.name, category: skill.category },
                {
                  onSuccess: () =>
                    setSkill({ name: "", category: "Technical" }),
                }
              );
            }}
          >
            <Input
              className="bg-slate-950"
              value={skill.name}
              onChange={event =>
                setSkill({ ...skill, name: event.target.value })
              }
              placeholder="Evidence-backed skill"
              required
            />
            <Input
              className="bg-slate-950"
              value={skill.category}
              onChange={event =>
                setSkill({ ...skill, category: event.target.value })
              }
              placeholder="Category"
              required
            />
            <Button disabled={addSkill.isPending}>Add skill</Button>
          </form>
          <div className="mt-5 space-y-2 text-sm">
            {data?.facts.map(item => (
              <p key={item.id} className="rounded-lg bg-slate-950 p-3">
                <b>{item.factTitle}</b>
                <span className="ml-2 text-slate-400">{item.factDetails}</span>
              </p>
            ))}
            {data?.skills.map(item => (
              <span
                key={item.id}
                className="mr-2 inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-100"
              >
                {item.skillName} · {item.category}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">
            Approval and manual privacy checklist
          </h2>
          <div className="mt-4 space-y-3">
            {pendingActions.length ? (
              pendingActions.map(item => (
                <div key={item.id} className="rounded-xl bg-slate-950 p-4">
                  <p className="font-medium">{item.description}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.proposedContent}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        approve.mutate({
                          actionId: item.id,
                          status: "approved",
                        })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        approve.mutate({
                          actionId: item.id,
                          status: "rejected",
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No evidence-backed approval requests yet.
              </p>
            )}
          </div>
          <ol className="mt-6 space-y-2 text-sm text-slate-300">
            <li>1. Review Friend List visibility directly in Facebook.</li>
            <li>2. Review public-post audience one post at a time.</li>
            <li>
              3. Keep the professional bio factual and avoid personal contact
              data.
            </li>
            <li>
              4. Complete Facebook login, CAPTCHA, security prompts, and 2FA
              yourself.
            </li>
          </ol>
          <Button
            className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            onClick={async () => {
              await navigator.clipboard.writeText(exportText);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy approved export
              </>
            )}
          </Button>
        </section>
      </div>
    </main>
  );
}
