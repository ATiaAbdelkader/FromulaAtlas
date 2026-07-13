'use client';

/**
 * About page — profiles Abdelkader Atia, the agricultural researcher behind
 * Formula Atlas. Renders a clean, editorial-style layout with a hero card,
 * mission statement, focus areas, and a closing reflection.
 */

import {
  Sprout, GraduationCap, Microscope, TrendingUp, Users, Lightbulb, Sparkles,
  MapPin, BookOpen, Heart, ArrowRight,
} from 'lucide-react';

export function AboutPage() {
  return (
    <main className="flex-1 max-w-[900px] mx-auto w-full p-4 sm:p-6 space-y-6 pb-20 sm:pb-6">

      {/* Hero card */}
      <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 text-white shadow-lg">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3 text-emerald-100 text-xs font-medium uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> About the founder
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar circle with initials */}
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl font-bold border-2 border-white/30">
              AA
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Abdelkader Atia</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Agricultural Researcher · PhD Candidate · Educator
              </p>
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs mt-2">
                <MapPin className="h-3 w-3" /> Algeria · Arid & Semi-arid Agriculture
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Me text */}
      <section className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" /> About Me
        </h2>

        <p className="text-sm leading-relaxed text-foreground/90">
          I am <strong>Abdelkader Atia</strong>, an agricultural researcher, educator, and lifelong learner from <strong>Algeria</strong> with a passion for advancing agriculture through science, technology, and innovation.
        </p>

        <p className="text-sm leading-relaxed text-foreground/90">
          My work focuses on <strong>animal reproduction</strong>, <strong>agribusiness</strong>, <strong>data-driven decision-making</strong>, and <strong>sustainable agricultural development</strong>. As a PhD researcher, I investigate practical solutions to improve livestock productivity while contributing to scientific research that addresses the challenges facing agriculture in arid and semi-arid regions.
        </p>

        <p className="text-sm leading-relaxed text-foreground/90">
          Alongside research, I enjoy designing training programs, creating educational content, and helping students, farmers, and professionals transform knowledge into practical skills. I believe that continuous learning, collaboration, and the intelligent use of digital tools and artificial intelligence can accelerate agricultural development and create lasting impact.
        </p>

        <p className="text-sm leading-relaxed text-foreground/90">
          This app reflects my personal operating system — a place to organize ideas, manage projects, track progress, and continuously improve both my work and personal growth. Every task, goal, and insight captured here contributes to my mission of becoming a more effective researcher, educator, and leader in agriculture.
        </p>
      </section>

      {/* Focus areas */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Microscope className="h-4 w-4" /> Focus Areas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FocusCard
            icon={Microscope}
            color="#0891b2"
            title="Animal Reproduction"
            description="PhD research on improving livestock productivity through reproductive technologies and management practices adapted to arid climates."
          />
          <FocusCard
            icon={TrendingUp}
            color="#16a34a"
            title="Agribusiness"
            description="Data-driven decision-making for farm profitability, supply chains, and sustainable enterprise development."
          />
          <FocusCard
            icon={Sprout}
            color="#f59e0b"
            title="Sustainable Agriculture"
            description="Practical solutions for arid and semi-arid regions — water efficiency, drought resilience, and soil health."
          />
          <FocusCard
            icon={Users}
            color="#6366f1"
            title="Education & Training"
            description="Designing programs that turn knowledge into skills for students, farmers, and agricultural professionals."
          />
        </div>
      </section>

      {/* What I believe */}
      <section className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-200">
          <Heart className="h-4 w-4" /> What I Believe
        </h3>
        <ul className="space-y-2 text-sm text-foreground/90">
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Continuous learning</strong> — agriculture evolves fast, and so must we.</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Collaboration</strong> — the best solutions come from connecting researchers, farmers, and technology.</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Intelligent use of AI</strong> — digital tools can accelerate agricultural development and create lasting impact.</span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Knowledge into practice</strong> — research only matters when it reaches the field.</span>
          </li>
        </ul>
      </section>

      {/* This app */}
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
          <GraduationCap className="h-4 w-4 text-emerald-600" /> About This App
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          <strong>Formula Atlas</strong> is my personal operating system for agriculture — a place to organize ideas, manage projects, track progress, and continuously improve. It bundles <strong>332 agronomic formulas</strong>, <strong>50+ interactive tools</strong>, <strong>GIS capabilities</strong>, <strong>AI specialists</strong>, and <strong>irrigation scheduling</strong> into one platform. Every feature exists because I needed it for my own work — and I'm sharing it so other farmers, researchers, and students can benefit too.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <Stat value="332" label="Formulas" />
          <Stat value="50+" label="Tools" />
          <Stat value="10" label="AI Agents" />
          <Stat value="20" label="Crop profiles" />
        </div>
      </section>

      {/* Closing */}
      <section className="text-center py-4">
        <p className="text-sm text-muted-foreground italic">
          "Every task, goal, and insight captured here contributes to my mission of becoming a more effective researcher, educator, and leader in agriculture."
        </p>
        <p className="text-xs text-muted-foreground mt-2">— Abdelkader Atia</p>
      </section>
    </main>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FocusCard({ icon: Icon, color, title, description }: {
  icon: typeof Microscope; color: string; title: string; description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4" style={{ borderTopWidth: 2, borderTopColor: color }}>
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center mb-2"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-2 text-center">
      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
