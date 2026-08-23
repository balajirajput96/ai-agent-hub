import { Toaster } from "@/components/ui/sonner";
import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ChatDashboard from "./pages/ChatDashboard";

const FacebookProfileWorkspace = lazy(
  () => import("./pages/FacebookProfileWorkspace")
);
const HindiReelsWorkspace = lazy(() => import("./pages/HindiReelsWorkspace"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={ChatDashboard} />
      <Route path={"/facebook-profile"}>
        <Suspense
          fallback={
            <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
              Loading workspace…
            </main>
          }
        >
          <FacebookProfileWorkspace />
        </Suspense>
      </Route>
      <Route path={"/hindi-reels"}>
        <Suspense
          fallback={
            <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
              Loading workspace…
            </main>
          }
        >
          <HindiReelsWorkspace />
        </Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
