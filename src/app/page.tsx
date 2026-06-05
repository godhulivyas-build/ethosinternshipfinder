import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopNavBar */}
      <header className="w-full flex justify-between items-center px-8 h-20 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-deep-forest text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-ink-charcoal">ethOS</span>
            <span className="text-[10px] uppercase font-mono tracking-widest bg-primary-fixed/50 text-deep-forest px-1.5 py-0.5 rounded ml-2 font-bold">early</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-8">
          <a className="text-on-surface-variant hover:text-ink-charcoal text-sm font-semibold transition-colors" href="#features">Features</a>
          <a className="text-on-surface-variant hover:text-ink-charcoal text-sm font-semibold transition-colors" href="#roles">Target Roles</a>
          <a className="text-on-surface-variant hover:text-ink-charcoal text-sm font-semibold transition-colors" href="#sources">Our Sources</a>
        </nav>
        <div>
          <Link href="/dashboard" className="px-5 py-2.5 bg-deep-forest text-on-primary text-sm font-semibold rounded-lg hover:bg-primary-container shadow-sm transition-all">
            Enter App Feed
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto py-24 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-fixed/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
        
        {/* Pulsing Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-on-surface-variant text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-ethereal-purple animate-pulse"></span>
          20 Genuine Pre-Vetted Opportunities Daily
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary leading-[1.1] mb-6">
          Startup internships, <br/>
          <span className="text-deep-forest">intelligence powered.</span>
        </h1>
        
        <p className="text-base md:text-lg text-on-surface-variant mb-10 max-w-2xl leading-relaxed">
          The curated discovery engine built exclusively for students, freshers, and early-careers. Zero agency spam. Dynamic Quality Scoring (0-100), customized resume keywords, and standout portfolio project blueprints.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard" className="px-8 py-3.5 bg-deep-forest text-on-primary text-sm font-bold rounded-lg hover:bg-primary-container shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
            Explore Opportunities Feed
            <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
          </Link>
          <a href="#features" className="px-8 py-3.5 bg-transparent border border-outline-variant text-ink-charcoal text-sm font-semibold rounded-lg hover:bg-surface-container-low transition-all">
            See how it works
          </a>
        </div>

        {/* Dashboard quick preview cards mockup */}
        <div className="mt-20 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border border-outline-variant/30 p-6 rounded-3xl bg-surface-container-lowest shadow-sm">
          <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:border-primary-fixed hover:-translate-y-0.5 transition-all">
            <span className="text-[10px] font-bold text-deep-forest tracking-widest uppercase font-mono">Zepto</span>
            <h4 className="text-sm font-bold text-ink-charcoal mt-1">Product Management Intern</h4>
            <span className="text-[11px] bg-primary-fixed/30 text-deep-forest border border-primary-fixed/50 px-2 py-0.5 rounded mt-2.5 inline-block font-mono font-medium">Score: 93/100</span>
          </div>
          <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:border-primary-fixed hover:-translate-y-0.5 transition-all">
            <span className="text-[10px] font-bold text-deep-forest tracking-widest uppercase font-mono">Decent AI</span>
            <h4 className="text-sm font-bold text-ink-charcoal mt-1">AI Engineer Intern</h4>
            <span className="text-[11px] bg-primary-fixed/30 text-deep-forest border border-primary-fixed/50 px-2 py-0.5 rounded mt-2.5 inline-block font-mono font-medium">Score: 98/100</span>
          </div>
          <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:border-primary-fixed hover:-translate-y-0.5 transition-all">
            <span className="text-[10px] font-bold text-deep-forest tracking-widest uppercase font-mono">Razorpay</span>
            <h4 className="text-sm font-bold text-ink-charcoal mt-1">Associate PM Intern</h4>
            <span className="text-[11px] bg-primary-fixed/30 text-deep-forest border border-primary-fixed/50 px-2 py-0.5 rounded mt-2.5 inline-block font-mono font-medium">Score: 96/100</span>
          </div>
        </div>
      </main>

      {/* Core Features list */}
      <section id="features" className="py-24 bg-surface-container-low border-t border-outline-variant/30 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-deep-forest font-mono">Core Advantages</span>
            <h2 className="text-3xl font-bold text-primary mt-2">Engineered to bypass job board noise</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-fixed hover:-translate-y-1 transition-all flex flex-col gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 border border-primary-fixed/50 text-deep-forest flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <h3 className="text-lg font-bold text-ink-charcoal">100% Pre-Vetted Feed</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">No staffing agencies, no generic aggregators, and absolutely no roles requiring 3+ years experience. Only genuine startup opportunities.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-fixed hover:-translate-y-1 transition-all flex flex-col gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 border border-primary-fixed/50 text-deep-forest flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <h3 className="text-lg font-bold text-ink-charcoal">AI Standout Toolkit</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Every internship is enriched with tailored technical portfolio project blueprints, exact resume keyword modifiers, and ATS keyword targets.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-fixed hover:-translate-y-1 transition-all flex flex-col gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed/30 border border-primary-fixed/50 text-deep-forest flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
              </div>
              <h3 className="text-lg font-bold text-ink-charcoal">Quality Scoring (0-100)</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Dynamically graded based on startup funding stage, paid vs unpaid status, remote flexibility, fresher-friendliness, and active recruiter signals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles section */}
      <section id="roles" className="py-24 bg-surface px-8 border-t border-outline-variant/30">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-deep-forest font-mono">Target Roles</span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 leading-tight">Focusing on high-leverage early careers</h2>
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
              <div key={idx} className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-deep-forest shrink-0"></span>
                <span className="text-xs font-bold text-ink-charcoal">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Sources */}
      <section id="sources" className="py-16 bg-surface-container-low/40 border-t border-outline-variant/30 px-8 text-center">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-deep-forest/80 font-mono">Ingestion Sources</span>
          <h4 className="text-sm font-semibold text-on-surface-variant mt-2">Aggregating hourly updates across premium networks</h4>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-8 text-on-surface-variant/70 text-xs font-mono font-bold">
            <span>WELLFOUND</span>
            <span>Y COMBINATOR JOBS</span>
            <span>LINKEDIN APIS</span>
            <span>CURVETTE</span>
            <span>INTERNSHALA</span>
            <span>OFFICIAL CAREERS PORTALS</span>
          </div>
        </div>
      </section>

      <footer className="w-full py-8 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant bg-surface-container-lowest mt-auto">
        <p>© 2026 ethOS Internship Intelligence Engine. Built for quality career builders.</p>
      </footer>
    </div>
  );
}
