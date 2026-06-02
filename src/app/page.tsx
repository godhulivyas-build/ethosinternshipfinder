import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-surface-dim flex flex-col selection:bg-primary/30 selection:text-primary">
      <header className="w-full flex justify-between items-center px-8 h-20 border-b border-outline-variant/10 bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] fill-current">school</span>
          <span className="text-xl font-bold tracking-tight text-on-surface">ethOS</span>
          <span className="text-[10px] uppercase font-mono tracking-widest bg-primary/20 text-primary px-1.5 py-0.5 rounded leading-none">early</span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a className="text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors" href="#features">Features</a>
          <a className="text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors" href="#roles">Target Roles</a>
          <a className="text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors" href="#sources">Our Sources</a>
        </nav>
        <div>
          <Link href="/dashboard" className="px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:brightness-110 shadow-md shadow-primary/10 transition-all">
            Enter App Feed
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-24 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          20 Genuine Pre-Vetted Opportunities Daily
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1] mb-6">
          Startup internships, <br/>
          <span className="text-primary bg-clip-text">intelligence powered.</span>
        </h1>
        
        <p className="text-base md:text-lg text-on-surface-variant mb-10 max-w-2xl leading-relaxed">
          The curated discovery engine built exclusively for students, freshers, and early-careers. Zero agency spam. Dynamic Quality Scoring (0-100), customized resume keywords, and standout portfolio project blueprints.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard" className="px-8 py-3.5 bg-primary text-on-primary text-sm font-bold rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
            Explore Opportunities Feed
            <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
          </Link>
          <a href="#features" className="px-8 py-3.5 bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container-high transition-all">
            See how it works
          </a>
        </div>

        {/* Dashboard quick preview cards mockup */}
        <div className="mt-20 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border border-outline-variant/15 p-6 rounded-3xl bg-surface-container-lowest/50 backdrop-blur-sm shadow-xl">
          <div className="p-4 bg-surface-container/40 rounded-2xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Zepto</span>
            <h4 className="text-sm font-bold text-on-surface mt-1">Product Management Intern</h4>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded mt-2 inline-block">Score: 93/100</span>
          </div>
          <div className="p-4 bg-surface-container/40 rounded-2xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Decent AI</span>
            <h4 className="text-sm font-bold text-on-surface mt-1">AI Engineer Intern</h4>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded mt-2 inline-block">Score: 98/100</span>
          </div>
          <div className="p-4 bg-surface-container/40 rounded-2xl border border-outline-variant/10">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Razorpay</span>
            <h4 className="text-sm font-bold text-on-surface mt-1">Associate PM Intern</h4>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded mt-2 inline-block">Score: 96/100</span>
          </div>
        </div>
      </main>

      {/* Core Features list */}
      <section id="features" className="py-24 bg-surface-container-lowest/60 border-t border-outline-variant/10 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Core Advantages</span>
            <h2 className="text-3xl font-extrabold text-on-surface mt-2">Engineered to bypass job board noise</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">100% Pre-Vetted Feed</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">No staffing agencies, no generic aggregators, and absolutely no roles requiring 3+ years experience. Only genuine startup opportunities.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">AI Standout Toolkit</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Every internship is enriched with tailored technical portfolio project blueprints, exact resume keyword modifiers, and ATS keyword targets.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface-container border border-outline-variant/10 hover:border-primary/20 transition-all flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">speed</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Quality Scoring (0-100)</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Dynamically graded based on startup funding stage, paid vs unpaid status, remote flexibility, fresher-friendliness, and active recruiter signals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles section */}
      <section id="roles" className="py-24 bg-surface-dim px-8 border-t border-outline-variant/10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Target Roles</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface mt-2 leading-tight">Focusing on high-leverage early careers</h2>
            <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">
              Unlike generic job boards displaying hundreds of senior postings, we specialize explicitly in internship and freshers-entry points across the modern startup ecosystem.
            </p>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            {[
              "Product Management", "AI & Machine Learning", "Founder's Office", 
              "Business Operations", "Data Analytics", "Growth Marketing", 
              "Community Manager", "Startup Generalist"
            ].map((role, idx) => (
              <div key={idx} className="p-4 bg-surface-container/50 rounded-2xl border border-outline-variant/10 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                <span className="text-xs font-bold text-on-surface">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Sources */}
      <section id="sources" className="py-16 bg-surface-container-lowest/40 border-t border-outline-variant/10 px-8 text-center">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary/70">Ingestion Sources</span>
          <h4 className="text-sm font-semibold text-on-surface-variant mt-2">Aggregating hourly updates across premium networks</h4>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-8 text-on-surface-variant/60 text-xs font-mono font-extrabold">
            <span>WELLFOUND</span>
            <span>Y COMBINATOR JOBS</span>
            <span>LINKEDIN APIS</span>
            <span>CURVETTE</span>
            <span>INTERNSHALA</span>
            <span>OFFICIAL CAREERS PORTALS</span>
          </div>
        </div>
      </section>

      <footer className="w-full py-8 border-t border-outline-variant/10 text-center text-xs text-on-surface-variant bg-surface-container-lowest/80 mt-auto">
        <p>© 2026 ethOS Internship Intelligence Engine. Built for quality career builders.</p>
      </footer>
    </div>
  );
}

