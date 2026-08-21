import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Plus,
  Github,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  CalendarClock,
  Clock3,
  HardDrive,
  History,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Menu,
  MessageSquare,
  User as UserIcon,
  Sparkles,
  Layers,
  Paperclip,
  FileText,
  X,
} from "lucide-react";

const MarkdownContent = lazy(() => import("@/components/MarkdownContent"));

// import startLogin if available or define local redirect
const startLogin = () => {
  window.location.href = "/api/oauth/callback";
};

export default function ChatDashboard() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [useAgent, setUseAgent] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "sessions" | "logs">(
    "chat"
  );
  const [selectedAttachment, setSelectedAttachment] = useState<{
    id: number;
    fileName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const sessionsQuery = trpc.agentHub.getSessions.useQuery(undefined, {
    enabled: !!user,
  });
  const healthQuery = trpc.agentHub.checkHealth.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000,
  });
  const reportHistoryQuery = trpc.agentHub.getDailyReportHistory.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 60000,
    }
  );
  const continuationQuery = trpc.agentHub.getContinuationStatus.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 60000,
    }
  );

  const messagesQuery = trpc.agentHub.getMessages.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const toolLogsQuery = trpc.agentHub.getToolLogs.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId, refetchInterval: 3000 }
  );
  const attachmentsQuery = trpc.agentHub.getAttachments.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  // Mutations
  const createSessionMutation = trpc.agentHub.createSession.useMutation({
    onSuccess: newSession => {
      utils.agentHub.getSessions.invalidate();
      setActiveSessionId(newSession.id);
      setNewSessionTitle("");
      setSessionError("");
    },
    onError: error => setSessionError(error.message),
  });

  const uploadAttachmentMutation = trpc.agentHub.uploadAttachment.useMutation({
    onSuccess: attachment => {
      setSelectedAttachment({
        id: attachment.id,
        fileName: attachment.fileName,
      });
      setUploadError("");
      utils.agentHub.getAttachments.invalidate({ sessionId: activeSessionId! });
    },
    onError: error => setUploadError(error.message),
  });

  const sendMessageMutation = trpc.agentHub.sendMessage.useMutation({
    onSuccess: () => {
      setInputMessage("");
      setSelectedAttachment(null);
      setMessageError("");
      utils.agentHub.getMessages.invalidate({ sessionId: activeSessionId! });
      utils.agentHub.getToolLogs.invalidate({ sessionId: activeSessionId! });
    },
    onError: error => setMessageError(error.message),
  });

  // Select first session by default when loaded
  useEffect(() => {
    if (
      sessionsQuery.data &&
      sessionsQuery.data.length > 0 &&
      !activeSessionId
    ) {
      setActiveSessionId(sessionsQuery.data[0].id);
    }
  }, [sessionsQuery.data, activeSessionId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-white">
        <Card className="max-w-md w-full bg-slate-900/80 border-slate-800 backdrop-blur shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              AI Agent Hub
            </CardTitle>
            <p className="text-sm text-slate-400">
              Sign in with your Manus account to access autonomous multi-step
              agents, GitHub repos, and Hugging Face inference models.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-6 shadow-lg shadow-indigo-600/25 transition-all"
              onClick={() => startLogin()}
            >
              Sign In with Manus OAuth
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const title =
      newSessionTitle.trim() ||
      `Agent Session ${new Date().toLocaleTimeString()}`;
    createSessionMutation.mutate({ title });
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSessionId) return;
    const supportedTypes = new Set([
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
    ]);
    if (!supportedTypes.has(file.type)) {
      setUploadError("Choose a PDF, TXT, MD, CSV, or JSON document.");
      return;
    }
    if (!file.size || file.size > 8 * 1024 * 1024) {
      setUploadError(
        file.size
          ? "Documents must be 8 MB or smaller."
          : "The selected document is empty."
      );
      return;
    }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () =>
      uploadAttachmentMutation.mutate({
        sessionId: activeSessionId,
        fileName: file.name,
        fileBase64: String(reader.result),
        mimeType: file.type,
      });
    reader.onerror = () =>
      setUploadError(
        "The document could not be read. Please try another file."
      );
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedAttachment) || !activeSessionId)
      return;
    sendMessageMutation.mutate({
      sessionId: activeSessionId,
      message: inputMessage.trim() || "Please analyze the attached document.",
      useAgent,
      attachmentId: selectedAttachment?.id,
    });
  };

  const healthData = healthQuery.data;
  const continuationControl = continuationQuery.data?.control;
  const continuationCycles = continuationQuery.data?.cycles ?? [];
  const remainingContinuationCycles = continuationControl
    ? Math.max(
        continuationControl.maxCycles - continuationControl.completedCycles,
        0
      )
    : null;
  const isContinuationLimitReached = remainingContinuationCycles === 0;
  const isContinuationLimitNear =
    remainingContinuationCycles !== null &&
    remainingContinuationCycles > 0 &&
    remainingContinuationCycles <= 24;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 md:flex">
      {/* Sidebar: Sessions & Integration Health */}
      <aside
        className={`${mobilePanel === "sessions" ? "flex" : "hidden"} h-[100dvh] w-full flex-col border-r border-slate-800 bg-slate-900/90 md:flex md:h-screen md:w-80 md:shrink-0`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">
                AI Agent Hub
              </h1>
              <p className="text-xs text-slate-400">Autonomous Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobilePanel("chat")}
              title="Back to chat"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-white" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-slate-400 hover:text-white" />
            </Button>
          </div>
        </div>

        {/* Integration Health Indicators */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Integrations Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-300" />
                <span>GitHub API</span>
              </div>
              <Badge
                variant="outline"
                className={
                  healthData?.github.status === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
              >
                {healthData?.github.status || "Checking..."}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Hugging Face</span>
              </div>
              <Badge
                variant="outline"
                className={
                  healthData?.huggingface.status === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }
              >
                {healthData?.huggingface.status || "Checking..."}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-300" />
                <span>Google Drive</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              >
                read-only
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-300" />
                <span>Gemini CLI</span>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/20"
              >
                auth pending
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-300" />
                <span>Antigravity CLI</span>
              </div>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/20"
              >
                auth pending
              </Badge>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-amber-200">
                  Connection help
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => healthQuery.refetch()}
                  disabled={healthQuery.isFetching}
                  className="h-7 border-amber-500/30 px-2 text-[10px] text-amber-100 hover:bg-amber-500/10"
                >
                  <RefreshCw
                    className={`mr-1 h-3 w-3 ${healthQuery.isFetching ? "animate-spin" : ""}`}
                  />
                  Refresh status
                </Button>
              </div>
              <p className="mt-2">
                Gemini requires a valid provider-managed credential. Update it
                only in your approved connector or secrets settings; never paste
                a key into this app or chat.
              </p>
              <p className="mt-2">
                Antigravity requires the provider’s interactive Google sign-in.
                Complete that sign-in in its official CLI flow, then refresh
                this status panel.
              </p>
            </div>
            {healthData?.huggingface.status === "authorization_required" && (
              <p className="px-1 text-[11px] leading-relaxed text-amber-300/80">
                Authorization is required before Hugging Face inference can run.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-950/30">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
            Daily automation
          </h2>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-indigo-200">
                GitHub + Drive summary
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              >
                active
              </Badge>
            </div>
            <p className="mt-2 leading-relaxed text-slate-400">
              Runs at 9:00 AM IST with read-only GitHub and Google Workspace
              scope. It does not publish, modify repositories, or change Drive
              files.
            </p>
          </div>
          <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-cyan-100">
                Hourly website continuation
              </span>
              <Badge
                variant="outline"
                className={
                  isContinuationLimitReached
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    : isContinuationLimitNear
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      : continuationControl?.isEnabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-300 border-slate-500/20"
                }
              >
                {continuationQuery.isLoading
                  ? "checking"
                  : isContinuationLimitReached
                    ? "limit reached"
                    : isContinuationLimitNear
                      ? "limit near"
                      : continuationControl?.isEnabled
                        ? "ready"
                        : "setup pending"}
              </Badge>
            </div>
            {continuationControl ? (
              <>
                <p className="mt-2 leading-relaxed text-slate-400">
                  {continuationControl.completedCycles} of{" "}
                  {continuationControl.maxCycles} bounded hourly health cycles
                  recorded. {remainingContinuationCycles} remain. This job
                  verifies only the website and database path; it does not
                  modify external services.
                </p>
                <div
                  className={`mt-2 rounded-lg border p-2 text-[11px] leading-relaxed ${
                    isContinuationLimitReached
                      ? "border-rose-500/20 bg-rose-500/5 text-rose-200"
                      : isContinuationLimitNear
                        ? "border-amber-500/20 bg-amber-500/5 text-amber-100"
                        : "border-slate-700 bg-slate-950/50 text-slate-400"
                  }`}
                  role="status"
                >
                  {isContinuationLimitReached
                    ? "Cycle limit reached. Pause or replace the approved Heartbeat before more work is scheduled; the daily GitHub and Drive summary remains separate."
                    : isContinuationLimitNear
                      ? `Only ${remainingContinuationCycles} cycles remain. Review the continuation control before the configured cap is reached.`
                      : "The hourly continuation runs independently from the daily read-only GitHub and Drive summary."}
                </div>
                {continuationCycles.length > 0 && (
                  <details className="mt-3 rounded-lg border border-cyan-500/15 bg-slate-950/40 p-2 text-[11px]">
                    <summary className="cursor-pointer font-medium text-cyan-100">
                      Hourly continuation history ({continuationCycles.length})
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[320px] text-left text-[10px]">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="pb-1 pr-2 font-medium">Time</th>
                            <th className="pb-1 pr-2 font-medium">
                              Validation
                            </th>
                            <th className="pb-1 font-medium">Next action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {continuationCycles.map(cycle => (
                            <tr key={cycle.id}>
                              <td className="py-1.5 pr-2 align-top whitespace-nowrap text-slate-400">
                                {new Date(cycle.createdAt).toLocaleString()}
                              </td>
                              <td className="py-1.5 pr-2 align-top break-words">
                                {cycle.validationStatus}
                              </td>
                              <td className="py-1.5 align-top break-words text-slate-400">
                                {cycle.nextRecommendedAction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => continuationQuery.refetch()}
                  disabled={continuationQuery.isFetching}
                  className="mt-3 h-7 border-cyan-500/30 px-2 text-[10px] text-cyan-100 hover:bg-cyan-500/10"
                >
                  <RefreshCw
                    className={`mr-1 h-3 w-3 ${continuationQuery.isFetching ? "animate-spin" : ""}`}
                  />
                  Refresh continuation
                </Button>
              </>
            ) : (
              <p className="mt-2 leading-relaxed text-slate-400">
                The hourly continuation control is being prepared. The active
                daily GitHub and Drive summary remains separate and read-only.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Report history
          </h2>
          <div className="space-y-2">
            {reportHistoryQuery.isLoading ? (
              <p className="text-xs text-slate-500">
                Loading private report receipts…
              </p>
            ) : reportHistoryQuery.data?.length ? (
              reportHistoryQuery.data.slice(0, 4).map(report => (
                <div
                  key={report.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="truncate font-medium">
                      {report.reportType}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                    {report.summary}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock3 className="h-3 w-3" />
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs leading-relaxed text-slate-500">
                Report receipts will appear here after an approved reporting
                worker records a delivered daily summary.
              </p>
            )}
            {reportHistoryQuery.isError && (
              <p className="text-xs text-rose-300">
                Report history is temporarily unavailable.
              </p>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-4 border-b border-slate-800">
          <form onSubmit={handleCreateSession} className="flex gap-2">
            <Input
              placeholder="New chat session..."
              value={newSessionTitle}
              onChange={e => setNewSessionTitle(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs text-white"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </form>
          {sessionError && (
            <p className="mt-2 text-xs text-rose-300" role="alert">
              {sessionError}
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 px-2 mb-1">
              Recent Sessions
            </div>
            {sessionsQuery.data?.map(session => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                  activeSessionId === session.id
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <UserIcon className="w-4 h-4 text-slate-300" />
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">
              {user.name || "Authenticated User"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user.email || "Manus User"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat & Tool Logs Area */}
      <main
        className={`${mobilePanel === "sessions" ? "hidden" : "flex"} h-[100dvh] min-w-0 w-full flex-1 flex-col bg-slate-950 md:flex md:h-screen`}
      >
        {/* Chat Header */}
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/50 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobilePanel("sessions")}
              title="Open sessions"
            >
              <Menu className="w-4 h-4 text-slate-300" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-sm">
                {sessionsQuery.data?.find(s => s.id === activeSessionId)
                  ?.title || "Select a session"}
              </h2>
              <p className="truncate text-[11px] text-slate-400">
                Private agent workspace with verified GitHub tools
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setMobilePanel(mobilePanel === "logs" ? "chat" : "logs")
              }
              className="border-slate-800 bg-slate-900 text-xs text-slate-300 lg:hidden"
            >
              {mobilePanel === "logs" ? (
                <MessageSquare className="w-3.5 h-3.5" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
              <span className="ml-1.5 hidden sm:inline">
                {mobilePanel === "logs" ? "Chat" : "Logs"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseAgent(!useAgent)}
              className={`text-xs border-slate-800 ${useAgent ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/30" : "bg-slate-900 text-slate-400"}`}
            >
              <Terminal className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Agentic Tools: </span>
              {useAgent ? "Active" : "Disabled"}
            </Button>
          </div>
        </header>

        {/* Content Layout: Chat History & Tool Panel */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Chat Messages */}
          <div
            className={`${mobilePanel === "logs" ? "hidden" : "flex"} min-h-0 flex-1 flex-col bg-slate-950 lg:flex`}
          >
            <ScrollArea className="flex-1 p-6 space-y-6">
              {!activeSessionId ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                  <Bot className="w-12 h-12 stroke-1 text-slate-600" />
                  <p className="text-sm">
                    Select or create a chat session from the sidebar to begin.
                  </p>
                </div>
              ) : messagesQuery.data?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3">
                  <Sparkles className="w-10 h-10 text-indigo-500/40" />
                  <h3 className="font-medium text-slate-300">
                    How can I help you today?
                  </h3>
                  <p className="text-xs max-w-sm">
                    Try asking: &quot;Search GitHub for React components&quot;
                    or attach a document for analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto w-full">
                  {messagesQuery.data?.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role !== "user" && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed max-w-xl shadow-md ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm"
                        }`}
                      >
                        <Suspense
                          fallback={
                            <span className="whitespace-pre-wrap">
                              {msg.content}
                            </span>
                          }
                        >
                          <MarkdownContent content={msg.content} />
                        </Suspense>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                          <UserIcon className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40">
              <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,text/plain,text/markdown,text/csv,application/json,.pdf,.txt,.md,.csv,.json"
                  onChange={handleFileSelection}
                  className="hidden"
                />
                {selectedAttachment && (
                  <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {selectedAttachment.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedAttachment(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {uploadError && (
                  <p className="mb-2 text-xs text-rose-300">{uploadError}</p>
                )}
                {messageError && (
                  <p className="mb-2 text-xs text-rose-300" role="alert">
                    {messageError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={
                      !activeSessionId || uploadAttachmentMutation.isPending
                    }
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 shrink-0 border-slate-800 bg-slate-950"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder={
                      uploadAttachmentMutation.isPending
                        ? "Uploading document…"
                        : "Ask the AI agent or discuss an uploaded document…"
                    }
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    disabled={
                      !activeSessionId ||
                      sendMessageMutation.isPending ||
                      uploadAttachmentMutation.isPending
                    }
                    className="bg-slate-950 border-slate-800 text-white focus-visible:ring-indigo-500 py-6"
                  />
                  <Button
                    type="submit"
                    disabled={
                      !activeSessionId ||
                      (!inputMessage.trim() && !selectedAttachment) ||
                      sendMessageMutation.isPending ||
                      uploadAttachmentMutation.isPending
                    }
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-6 shadow-lg shadow-indigo-600/25"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel: Live Agent Tool Execution Logs */}
          <div
            className={`${mobilePanel === "logs" ? "flex" : "hidden"} h-full w-full flex-col border-t border-slate-800 bg-slate-900/60 lg:flex lg:h-full lg:w-80 lg:border-l lg:border-t-0`}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Live Tool Execution Logs
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
              >
                Real-time
              </Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="mb-5">
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Private documents
                </h4>
                {attachmentsQuery.data?.length ? (
                  <div className="space-y-2">
                    {attachmentsQuery.data.map(attachment => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 hover:border-indigo-500/40"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-300" />
                        <span className="truncate">{attachment.fileName}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No documents uploaded.
                  </p>
                )}
              </div>
              <div className="mb-4 border-t border-slate-800" />
              {!activeSessionId ? (
                <div className="text-xs text-slate-500 text-center py-8">
                  No active session
                </div>
              ) : toolLogsQuery.data?.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-8">
                  No tool calls executed in this session yet. Try asking the
                  agent to search GitHub.
                </div>
              ) : (
                <div className="space-y-3">
                  {toolLogsQuery.data?.map(log => (
                    <div
                      key={log.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-300">
                          {log.toolName}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            log.status === "success"
                              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                              : "text-amber-400 border-amber-500/20 bg-amber-500/10"
                          }
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded font-mono truncate">
                        Input: {log.inputArgs}
                      </div>
                      {log.outputResult && (
                        <details className="text-[11px] text-slate-300">
                          <summary className="cursor-pointer text-indigo-400 font-medium">
                            View Output
                          </summary>
                          <pre className="mt-1 bg-slate-900 p-2 rounded text-[10px] overflow-x-auto text-slate-300 font-mono">
                            {log.outputResult.slice(0, 300)}...
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}
