import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import {
  Activity,
  Bot,
  Cpu,
  FileText,
  Github,
  Layers,
  LogOut,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Terminal,
  User as UserIcon,
  X,
} from "lucide-react";

const ACCEPTED_DOCUMENTS = "application/pdf,text/plain,text/markdown,text/csv,application/json,.pdf,.txt,.md,.csv,.json";

export default function ChatDashboard() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [useAgent, setUseAgent] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState<{ id: number; fileName: string } | null>(null);
  const [uploadError, setUploadError] = useState("");

  const sessionsQuery = trpc.agentHub.getSessions.useQuery(undefined, { enabled: !!user });
  const healthQuery = trpc.agentHub.checkHealth.useQuery(undefined, { enabled: !!user, refetchInterval: 15_000 });
  const messagesQuery = trpc.agentHub.getMessages.useQuery({ sessionId: activeSessionId! }, { enabled: !!activeSessionId });
  const toolLogsQuery = trpc.agentHub.getToolLogs.useQuery({ sessionId: activeSessionId! }, { enabled: !!activeSessionId, refetchInterval: 3_000 });
  const attachmentsQuery = trpc.agentHub.getAttachments.useQuery({ sessionId: activeSessionId! }, { enabled: !!activeSessionId });

  const createSessionMutation = trpc.agentHub.createSession.useMutation({
    onSuccess: (session) => {
      setActiveSessionId(session.id);
      setNewSessionTitle("");
      utils.agentHub.getSessions.invalidate();
    },
  });

  const uploadAttachmentMutation = trpc.agentHub.uploadAttachment.useMutation({
    onSuccess: (attachment) => {
      setSelectedAttachment({ id: attachment.id, fileName: attachment.fileName });
      setUploadError("");
      utils.agentHub.getAttachments.invalidate({ sessionId: activeSessionId! });
    },
    onError: (error) => setUploadError(error.message),
  });

  const sendMessageMutation = trpc.agentHub.sendMessage.useMutation({
    onSuccess: () => {
      setInputMessage("");
      setSelectedAttachment(null);
      utils.agentHub.getMessages.invalidate({ sessionId: activeSessionId! });
      utils.agentHub.getToolLogs.invalidate({ sessionId: activeSessionId! });
    },
  });

  useEffect(() => {
    if (!activeSessionId && sessionsQuery.data?.[0]) setActiveSessionId(sessionsQuery.data[0].id);
  }, [activeSessionId, sessionsQuery.data]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur">
          <CardHeader className="text-center"><div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/15"><Bot className="h-8 w-8 text-indigo-300" /></div><CardTitle className="text-2xl text-white">AI Agent Hub</CardTitle></CardHeader>
          <CardContent><p className="mb-5 text-center text-sm leading-6 text-slate-400">Secure, private agent workspaces with GitHub, Hugging Face, and document analysis.</p><Button className="w-full bg-indigo-600 py-6 hover:bg-indigo-500" onClick={startLogin}>Sign in with Manus OAuth</Button></CardContent>
        </Card>
      </div>
    );
  }

  const activeSessionTitle = sessionsQuery.data?.find((session) => session.id === activeSessionId)?.title || "Select a session";
  const integrationBadge = (status?: string) => status === "connected" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300";

  function createSession(event: React.FormEvent) {
    event.preventDefault();
    createSessionMutation.mutate({ title: newSessionTitle.trim() || `Agent session · ${new Date().toLocaleTimeString()}` });
  }

  function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !activeSessionId) return;
    const supported = new Set(["application/pdf", "text/plain", "text/markdown", "text/csv", "application/json"]);
    if (!supported.has(file.type)) { setUploadError("Choose a PDF, TXT, MD, CSV, or JSON document."); return; }
    if (file.size === 0) { setUploadError("The selected document is empty."); return; }
    if (file.size > 8 * 1024 * 1024) { setUploadError("Documents must be 8 MB or smaller."); return; }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => uploadAttachmentMutation.mutate({ sessionId: activeSessionId, fileName: file.name, fileBase64: String(reader.result), mimeType: file.type });
    reader.onerror = () => setUploadError("This document could not be read. Please try another file.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!activeSessionId || (!inputMessage.trim() && !selectedAttachment)) return;
    sendMessageMutation.mutate({
      sessionId: activeSessionId,
      message: inputMessage.trim() || "Please analyze the attached document.",
      useAgent,
      attachmentId: selectedAttachment?.id,
    });
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <aside className="hidden w-80 shrink-0 flex-col border-r border-slate-800 bg-slate-900/85 md:flex">
        <div className="flex items-center justify-between border-b border-slate-800 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20"><Sparkles className="h-5 w-5" /></div><div><h1 className="font-bold">AI Agent Hub</h1><p className="text-xs text-slate-400">Autonomous workspace</p></div></div><Button variant="ghost" size="icon" onClick={() => logout()} title="Sign out"><LogOut className="h-4 w-4 text-slate-400" /></Button></div>
        <div className="border-b border-slate-800 bg-slate-950/40 p-4"><div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Activity className="h-3.5 w-3.5 text-indigo-300" /> Integration health</div><div className="space-y-2"><div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs"><span className="flex items-center gap-2"><Github className="h-4 w-4" />GitHub</span><Badge variant="outline" className={integrationBadge(healthQuery.data?.github.status)}>{healthQuery.data?.github.status || "Checking"}</Badge></div><div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs"><span className="flex items-center gap-2"><Cpu className="h-4 w-4 text-indigo-300" />Hugging Face</span><Badge variant="outline" className={integrationBadge(healthQuery.data?.huggingface.status)}>{healthQuery.data?.huggingface.status || "Checking"}</Badge></div></div></div>
        <form onSubmit={createSession} className="flex gap-2 border-b border-slate-800 p-4"><Input value={newSessionTitle} onChange={(event) => setNewSessionTitle(event.target.value)} placeholder="New chat session" className="border-slate-800 bg-slate-950 text-xs" /><Button size="icon" type="submit" className="bg-indigo-600 hover:bg-indigo-500"><Plus className="h-4 w-4" /></Button></form>
        <ScrollArea className="flex-1 p-3"><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chat sessions</p><div className="space-y-1">{sessionsQuery.data?.map((session) => <button key={session.id} onClick={() => setActiveSessionId(session.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs ${activeSessionId === session.id ? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-200" : "text-slate-400 hover:bg-slate-800"}`}><Layers className="h-3.5 w-3.5" /><span className="truncate">{session.title}</span></button>)}</div></ScrollArea>
        <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/50 p-4"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800"><UserIcon className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{user.name || "Authenticated user"}</p><p className="truncate text-[10px] text-slate-400">{user.email || "Manus account"}</p></div></div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col"><header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 md:px-6"><div className="flex min-w-0 items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10"><Bot className="h-4 w-4 text-indigo-300" /></div><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{activeSessionTitle}</h2><p className="truncate text-[11px] text-slate-400">Private agent conversation with connected tools</p></div></div><Button variant="outline" size="sm" onClick={() => setUseAgent(!useAgent)} className={useAgent ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200" : "border-slate-700 text-slate-400"}><Terminal className="mr-1.5 h-3.5 w-3.5" />{useAgent ? "Agent tools on" : "Agent tools off"}</Button></header>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row"><section className="flex min-h-0 flex-1 flex-col"><ScrollArea className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-3xl space-y-5">{!activeSessionId ? <EmptyState text="Create a chat session to begin." /> : messagesQuery.data?.length ? messagesQuery.data.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role !== "user" && <Avatar icon={<Bot className="h-4 w-4" />} tone="agent" />}<div className={`max-w-[82%] rounded-2xl p-3.5 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-800 bg-slate-900 text-slate-200"}`}><Streamdown>{message.content}</Streamdown></div>{message.role === "user" && <Avatar icon={<UserIcon className="h-4 w-4" />} tone="user" />}</div>) : <EmptyState text="Attach a document, search GitHub, or ask the agent anything." />}</div></ScrollArea>
            <div className="border-t border-slate-800 bg-slate-900/45 p-4"><form onSubmit={sendMessage} className="mx-auto max-w-3xl"><input ref={fileInputRef} type="file" accept={ACCEPTED_DOCUMENTS} onChange={uploadFile} className="hidden" />{selectedAttachment && <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200"><FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{selectedAttachment.fileName}</span><button type="button" onClick={() => setSelectedAttachment(null)} className="text-indigo-200 hover:text-white"><X className="h-3.5 w-3.5" /></button></div>}{uploadError && <p className="mb-2 text-xs text-rose-300">{uploadError}</p>}<div className="flex gap-2"><Button type="button" variant="outline" size="icon" disabled={!activeSessionId || uploadAttachmentMutation.isPending} onClick={() => fileInputRef.current?.click()} className="h-12 w-12 shrink-0 border-slate-800 bg-slate-950 text-slate-300"><Paperclip className="h-4 w-4" /></Button><Input value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} disabled={!activeSessionId || sendMessageMutation.isPending || uploadAttachmentMutation.isPending} placeholder={uploadAttachmentMutation.isPending ? "Uploading document…" : "Ask the agent or discuss an uploaded document…"} className="h-12 border-slate-800 bg-slate-950" /><Button type="submit" disabled={!activeSessionId || (!inputMessage.trim() && !selectedAttachment) || sendMessageMutation.isPending || uploadAttachmentMutation.isPending} className="h-12 bg-indigo-600 px-5 hover:bg-indigo-500"><Send className="h-4 w-4" /></Button></div></form></div>
          </section>
          <aside className="hidden w-80 shrink-0 border-l border-slate-800 bg-slate-900/55 lg:flex lg:flex-col"><div className="border-b border-slate-800 p-4"><p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><Terminal className="h-3.5 w-3.5 text-indigo-300" />Session documents & logs</p></div><ScrollArea className="flex-1 p-4"><PanelTitle title="Uploaded documents" />{attachmentsQuery.data?.length ? <div className="space-y-2">{attachmentsQuery.data.map((attachment) => <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 hover:border-indigo-500/40"><FileText className="h-3.5 w-3.5 shrink-0 text-indigo-300" /><span className="truncate">{attachment.fileName}</span></a>)}</div> : <p className="text-xs text-slate-500">No documents uploaded.</p>}<div className="my-5 border-t border-slate-800" /><PanelTitle title="Tool execution" />{toolLogsQuery.data?.length ? <div className="space-y-3">{toolLogsQuery.data.map((log) => <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"><div className="mb-2 flex items-center justify-between gap-2"><span className="font-semibold text-indigo-200">{log.toolName}</span><Badge variant="outline" className={log.status === "success" ? "border-emerald-500/20 text-emerald-300" : "border-amber-500/20 text-amber-300"}>{log.status}</Badge></div><p className="truncate font-mono text-[10px] text-slate-500">{log.inputArgs}</p></div>)}</div> : <p className="text-xs text-slate-500">No tool activity in this session.</p>}</ScrollArea></aside>
        </div>
      </main>
    </div>
  );
}

function Avatar({ icon, tone }: { icon: ReactNode; tone: "agent" | "user" }) { return <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone === "agent" ? "bg-indigo-600 text-white" : "border border-slate-700 bg-slate-800 text-slate-300"}`}>{icon}</div>; }
function EmptyState({ text }: { text: string }) { return <div className="grid min-h-[52vh] place-items-center text-center"><div><Sparkles className="mx-auto mb-3 h-10 w-10 text-indigo-400/40" /><h3 className="text-sm font-medium text-slate-300">How can I help today?</h3><p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">{text}</p></div></div>; }
function PanelTitle({ title }: { title: string }) { return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>; }
