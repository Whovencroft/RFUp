import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Incidents from "./pages/Incidents";
import SessionLog from "./pages/SessionLog";
import GmPanel from "./pages/GmPanel";
import PrintSheet from "./pages/PrintSheet";
import Sessions from "./pages/Sessions";
import AiSession from "./pages/AiSession";
import Lobby from "./pages/Lobby";
import Debrief from "./pages/Debrief";
import NavBar from "./components/NavBar";

function Router() {
  return (
    <Switch>
      {/* Print route: no nav chrome, white background */}
      <Route path="/print">
        <div className="min-h-screen bg-white">
          <PrintSheet />
        </div>
      </Route>
      {/* All other routes: standard dark layout with NavBar */}
      <Route>
        <div className="min-h-screen bg-background flex flex-col">
          <NavBar />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/play" component={Play} />
              <Route path="/incidents" component={Incidents} />
              <Route path="/log" component={SessionLog} />
              <Route path="/gm" component={GmPanel} />
              <Route path="/sessions" component={Sessions} />
              <Route path="/sessions/:id/debrief" component={Debrief} />
              <Route path="/sessions/:id" component={AiSession} />
              <Route path="/lobby" component={Lobby} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
