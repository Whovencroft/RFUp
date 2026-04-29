import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Shield, Dices, AlertTriangle, ScrollText, ChevronRight, Lock, Eye, Wifi } from "lucide-react";

const rules = [
  { num: "01", text: "Say what you do and roll a number of D6s, determined by the level of the relevant skill you have." },
  { num: "02", text: "If the sum of your roll is higher than the opposing roll set by the Shift Supervisor, the thing you wanted to happen, happens." },
  { num: "03", text: "At start, you have only one skill: Do Anything 1." },
  { num: "04", text: "If you roll all 6s, you get a new skill specific to the action, one level higher than the one you used." },
  { num: "05", text: "For every roll you fail, you get 1 XP." },
  { num: "06", text: "XP can be used to change a die into a 6 for advancement purposes only." },
];

const features = [
  { icon: Dices, title: "Digital Character Sheet", desc: "Create your operator, track skills, and manage XP — all persistent and synced." },
  { icon: Shield, title: "Dice Roller", desc: "Animated D6 rolls with individual results, sums, and automatic skill advancement detection." },
  { icon: AlertTriangle, title: "Incident Board", desc: "A curated library of security incidents — from badge anomalies to rogue network devices." },
  { icon: ScrollText, title: "Session Log", desc: "A shared real-time feed of every roll, skill gain, and XP change across all operators." },
  { icon: Lock, title: "Shift Supervisor Mode", desc: "GM tools: manage incidents, set difficulty, and view all player sheets." },
  { icon: Eye, title: "Threat Scenarios", desc: "Twelve pre-written security incidents grounded in real data center threat models." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="text-foreground">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.72_0.12_165/0.08)_0%,transparent_60%)]" />
        <div className="container py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1 mb-6">
              <Wifi className="w-3 h-3" />
              FACILITY 404 — UPTIME CRITICAL
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-5 leading-tight">
              Roll for<br />
              <span className="text-primary">Uptime</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              A slice-of-life tabletop RPG set in the depths of Facility 404 — where the SLA is 99.999%, 
              the badge readers have opinions, and every shift is a new incident report waiting to happen.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/play">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <Dices className="w-4 h-4" />
                    Enter the Facility
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  <Shield className="w-4 h-4" />
                  Clock In
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <Link href="/incidents">
                <Button variant="outline" className="border-border text-foreground hover:bg-accent gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  View Incidents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Rules ── */}
      <section className="border-b border-border">
        <div className="container py-16">
          <div className="mb-10">
            <p className="text-xs font-mono text-primary mb-2 tracking-widest">THE SYSTEM</p>
            <h2 className="text-3xl font-display font-semibold text-foreground">Core Rules</h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Roll for Uptime uses the Roll for Shoes micro-system. Six rules. That's it. The rest is 
              whatever happens when you try to explain to your Shift Supervisor why the biometric 
              terminal is now sentient.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {rules.map((rule) => (
              <div
                key={rule.num}
                className="flex gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <span className="font-mono text-primary text-sm font-medium shrink-0 pt-0.5">{rule.num}</span>
                <p className="text-sm text-foreground leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Setting ── */}
      <section className="border-b border-border">
        <div className="container py-16">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-mono text-primary mb-2 tracking-widest">THE SETTING</p>
              <h2 className="text-3xl font-display font-semibold text-foreground mb-4">Facility 404</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Facility 404 is a sprawling, subterranean data center that hosts everything from 
                mundane corporate backups to infrastructure so sensitive that its classification level 
                is itself classified. The hum of the HVAC is a constant presence. The raised floor 
                tiles are slightly uneven. The coffee machine in the security breakroom has been 
                flagged in three separate incident reports.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are the security team. Your job is access control, threat detection, vendor 
                management, surveillance integrity, and the general prevention of things that should 
                not happen from happening. The SLA is 99.999%. You are the last line of defense 
                between uptime and whatever is currently in the loading dock claiming to be from 
                facilities management.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The facility operates at the intersection of the mundane and the inexplicable. 
                Badge readers develop preferences. Network anomalies defy physical explanation. 
                Vendors arrive with paperwork that is almost correct. Every shift is a new 
                incident report waiting to be filed.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono text-primary mb-2 tracking-widest">TONE GUIDE</p>
              {[
                { label: "Slice-of-Life", desc: "The stakes are rarely 'save the world.' They are usually 'keep the SLA at 99.999% so we don't have to stay late.'" },
                { label: "Dry Humor", desc: "The absurdity of the situation is treated with bureaucratic indifference. The incident report will be thorough." },
                { label: "Grounded Threat", desc: "All scenarios are rooted in real security operations: access control, surveillance, vendor management, network anomalies." },
                { label: "Emergent Chaos", desc: "Failures are funny. Skills are specific. 'Stale Donut Diplomacy 2' is a valid advancement if you rolled all sixes." },
              ].map(({ label, desc }) => (
                <div key={label} className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b border-border">
        <div className="container py-16">
          <div className="mb-10">
            <p className="text-xs font-mono text-primary mb-2 tracking-widest">THE COMPANION</p>
            <h2 className="text-3xl font-display font-semibold text-foreground">What's Inside</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shift Supervisor Note ── */}
      <section>
        <div className="container py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-mono text-primary mb-2 tracking-widest">FOR THE SHIFT SUPERVISOR</p>
            <h2 className="text-3xl font-display font-semibold text-foreground mb-4">Running the Facility</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Shift Supervisor is the Game Master. They present the incident, set the opposing 
              roll difficulty, and decide whether a player's creative interpretation of 
              "Aggressive Visitor De-escalation 3" is applicable to the current situation.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Failures should make things worse in a mundane or absurd way. Encourage specific, 
              ridiculous skills. Keep it moving. If a player wants to use their badge reader 
              expertise to negotiate with a rogue drone, let them roll for it.
            </p>
            <p className="text-xs font-mono text-muted-foreground border border-border rounded px-3 py-2 bg-card">
              The first operator to sign in is automatically granted Shift Supervisor access and can promote others from the GM Panel.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
