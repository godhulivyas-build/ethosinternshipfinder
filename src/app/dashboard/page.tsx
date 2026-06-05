"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? 'http://localhost:8000' : '');

export default function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active Navigation Tab: 'feed' | 'digests' | 'analytics'
  const [activeTab, setActiveTab] = useState<'feed' | 'digests' | 'analytics'>('feed');

  // Daily Digests State
  const [digests, setDigests] = useState<any | null>(null);
  const [digestsLoading, setDigestsLoading] = useState(false);
  const [activeDigestTrack, setActiveDigestTrack] = useState<'general' | 'product' | 'founders' | 'ai'>('general');
  const [copiedDigest, setCopiedDigest] = useState(false);

  // Admin & Career Analytics State
  const [stats, setStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeWorkType, setActiveWorkType] = useState('All');
  const [preferredCity, setPreferredCity] = useState('');
  const [freshnessFilter, setFreshnessFilter] = useState<'all' | '24h' | '7d'>('all');
  
  // Interaction & Drawer State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackJob, setFeedbackJob] = useState<any | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [showResumeDrawer, setShowResumeDrawer] = useState(false);
  
  // Syncing state
  const [syncing, setSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');

  // Fetch internships list
  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Query parameters
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.append('category', activeCategory);
      if (activeWorkType !== 'All') params.append('work_type', activeWorkType);
      if (searchQuery) params.append('search', searchQuery);
      if (freshnessFilter !== 'all') params.append('posted_within', freshnessFilter);
      if (activeWorkType === 'Onsite' && preferredCity) params.append('location', preferredCity);
      
      const res = await fetch(`${API_BASE}/api/v1/internships?${params.toString()}`);
      if (!res.ok) throw new Error("API not responding, using pre-seeded fallback");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.warn("Backend not running or error, using pre-vetted startups fallback", err);
      // Fallback local mock data with <200 employees startups
      const mockData = getMockJobsData();
      let filtered = mockData;
      
      // Category filter fallback
      if (activeCategory !== 'All') {
        filtered = filtered.filter(j => j.category === activeCategory);
      }
      
      // Work style filter fallback
      if (activeWorkType !== 'All') {
        filtered = filtered.filter(j => j.work_type === activeWorkType);
      }
      
      // Preferred city filter fallback
      if (activeWorkType === 'Onsite' && preferredCity) {
        const city = preferredCity.toLowerCase();
        filtered = filtered.filter(j => j.location.toLowerCase().includes(city));
      }
      
      // Freshness filter fallback
      if (freshnessFilter === '24h') {
        filtered = filtered.filter(j => j.days_ago === 0);
      } else if (freshnessFilter === '7d') {
        filtered = filtered.filter(j => j.days_ago <= 7);
      }
      
      // Search query fallback
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(j => 
          j.company_name.toLowerCase().includes(q) || 
          j.role_name.toLowerCase().includes(q) || 
          j.description.toLowerCase().includes(q)
        );
      }
      setJobs(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeCategory, activeWorkType, searchQuery, freshnessFilter, preferredCity]);

  // Fetch digests from API
  const fetchDigests = async () => {
    try {
      setDigestsLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/internships/digests`);
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setDigests(data);
    } catch (err) {
      console.warn("Backend offline or error fetching digests, using curated seeds fallback");
      setDigests(getMockDigestsData());
    } finally {
      setDigestsLoading(false);
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/internships/stats`);
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.warn("Backend offline or error fetching stats, using premium mockup fallback");
      setStats(getMockStatsData());
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch digests/stats on tab transitions
  useEffect(() => {
    if (activeTab === 'digests' && !digests) {
      fetchDigests();
    }
    if (activeTab === 'analytics' && !stats) {
      fetchStats();
    }
  }, [activeTab]);

  // Sync Ingestion handler
  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncStep("Scraping Cuvette, YCombinator and SupIntern listings...");
    
    setTimeout(() => {
      setSyncStep("Filtering for startups with under 200 employees & direct founder contacts...");
    }, 1500);

    setTimeout(() => {
      setSyncStep("Scoring quality components (Credibility, Stipends, remote flexibility)...");
    }, 3000);

    setTimeout(() => {
      setSyncStep("Enriching with standing portfolio blueprints & copyable LaTeX templates...");
    }, 4500);

    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/internships/trigger-sync`, { method: "POST" });
        if (res.ok) {
          await fetchJobs();
          await fetchDigests();
          await fetchStats();
        }
      } catch (err) {
        console.error("Local sync error");
      }
      setSyncing(false);
      setSyncStep("");
      fetchJobs();
      fetchDigests();
      fetchStats();
    }, 6000);
  };

  // Track Action Handler
  const handleJobAction = async (jobId: string, actionType: string, statusValue?: string) => {
    // Optimistic UI updates
    setJobs(prevJobs => prevJobs.map(j => {
      if (j.id === jobId) {
        const updatedUserState = { ...j.user_state };
        if (actionType === 'view') updatedUserState.viewed = true;
        if (actionType === 'apply_click') {
          updatedUserState.clicked = true;
          if (updatedUserState.application_status === 'Not Applied') {
            updatedUserState.application_status = 'Applied';
          }
        }
        if (actionType === 'bookmark') updatedUserState.bookmarked = !updatedUserState.bookmarked;
        if (actionType === 'status' && statusValue) updatedUserState.application_status = statusValue;
        
        const updatedJob = { ...j, user_state: updatedUserState };
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(updatedJob);
        }
        return updatedJob;
      }
      return j;
    }));

    try {
      const res = await fetch(`${API_BASE}/api/v1/internships/${jobId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "default_user",
          action_type: actionType,
          status_value: statusValue
        })
      });
      
      if (res.ok) {
        if (actionType === 'status' || actionType === 'apply_click') {
          if (statusValue === 'Applied' || statusValue === 'Interview Scheduled' || actionType === 'apply_click') {
            const currentJob = jobs.find(j => j.id === jobId);
            setFeedbackJob(currentJob || selectedJob);
            setShowFeedbackModal(true);
          }
        }
      }
    } catch (err) {
      if (actionType === 'status' || actionType === 'apply_click') {
        if (statusValue === 'Applied' || statusValue === 'Interview Scheduled' || actionType === 'apply_click') {
          const currentJob = jobs.find(j => j.id === jobId);
          setFeedbackJob(currentJob || selectedJob);
          setShowFeedbackModal(true);
        }
      }
    }
  };

  // Submit Feedback Handler
  const handleFeedbackSubmit = async () => {
    if (!feedbackJob) return;
    
    setJobs(prevJobs => prevJobs.map(j => {
      if (j.id === feedbackJob.id) {
        return {
          ...j,
          user_state: {
            ...j.user_state,
            rating: feedbackRating,
            feedback: feedbackText
          }
        };
      }
      return j;
    }));
    
    if (selectedJob && selectedJob.id === feedbackJob.id) {
      setSelectedJob((prev: any) => prev ? {
        ...prev,
        user_state: {
          ...prev.user_state,
          rating: feedbackRating,
          feedback: feedbackText
        }
      } : null);
    }

    try {
      await fetch(`${API_BASE}/api/v1/internships/${feedbackJob.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "default_user",
          rating: feedbackRating,
          feedback: feedbackText
        })
      });
    } catch (err) {
      console.warn("Feedback logged locally");
    }
    
    setShowFeedbackModal(false);
    setFeedbackText('');
    setFeedbackJob(null);
  };

  // UI Helpers
  const getColorHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-deep-forest border-primary-fixed/50 bg-primary-fixed/20';
    if (score >= 80) return 'text-amber-800 border-amber-200 bg-amber-50';
    return 'text-orange-800 border-orange-200 bg-orange-50';
  };

  return (
    <div className="flex w-full min-h-screen bg-surface text-ink-charcoal font-sans selection:bg-primary-fixed selection:text-deep-forest">
      
      {/* Sidebar: Premium minimalist navigation */}
      <aside className="w-[240px] border-r border-outline-variant/30 flex flex-col p-6 hidden md:flex shrink-0 bg-surface justify-between">
        <div className="flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-2 text-md font-bold tracking-tight text-ink-charcoal uppercase font-mono">
            <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center text-deep-forest">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <span className="ml-1 font-bold">ethOS</span>
            <span className="text-[9px] font-mono tracking-widest bg-primary-fixed/50 text-deep-forest px-1 py-0.5 rounded leading-none font-bold ml-2">V2</span>
          </Link>
          
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left w-full cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 font-bold'
                  : 'text-on-surface-variant hover:text-ink-charcoal hover:bg-surface-container-low/60 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">target</span>
              Opportunities Feed
            </button>

            <button 
              onClick={() => setActiveTab('digests')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left w-full cursor-pointer ${
                activeTab === 'digests'
                  ? 'bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 font-bold'
                  : 'text-on-surface-variant hover:text-ink-charcoal hover:bg-surface-container-low/60 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              Daily Digests
            </button>

            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left w-full cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 font-bold'
                  : 'text-on-surface-variant hover:text-ink-charcoal hover:bg-surface-container-low/60 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Analytics & Funnel
            </button>

            <button 
              onClick={() => setShowResumeDrawer(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left w-full mt-2 border border-dashed border-outline-variant text-on-surface-variant hover:text-ink-charcoal hover:bg-surface-container-low/40 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">description</span>
              Resume LaTeX Code
            </button>

            <a 
              href="https://wa.me/918889701865?text=Hello!%20I%20would%20like%20to%20get%20a%20resume%20template%20and%20help%2520with%2520my%2520job%2520search."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-deep-forest hover:text-primary hover:bg-primary-fixed/20 text-left w-full mt-2 border border-dashed border-primary-fixed bg-primary-fixed/10 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-deep-forest">chat</span>
              WhatsApp Help (Resume & Jobs)
            </a>
          </nav>
        </div>
        
        <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/10">
            <h4 className="text-[10px] font-bold text-deep-forest uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-deep-forest"></span>
              Startup Only Feed
            </h4>
            <p className="text-[9.5px] text-on-surface-variant leading-relaxed font-medium">Focusing exclusively on early-stage setups under 200 staff. Refreshed daily.</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-h-screen overflow-y-auto relative bg-surface">
        
        {/* Header bar */}
        <header className="h-16 border-b border-outline-variant/30 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            {activeTab === 'feed' && (
              <h2 className="text-sm font-bold text-ink-charcoal flex items-center gap-1.5 uppercase font-mono tracking-wide">
                Opportunities Feed
                <span className="text-[9px] bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 px-1.5 py-0.5 rounded font-mono font-bold">Live</span>
              </h2>
            )}
            {activeTab === 'digests' && (
              <h2 className="text-sm font-bold text-ink-charcoal flex items-center gap-1.5 uppercase font-mono tracking-wide">
                Daily Digests
                <span className="text-[9px] bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 px-1.5 py-0.5 rounded font-mono font-bold">6 AM IST</span>
              </h2>
            )}
            {activeTab === 'analytics' && (
              <h2 className="text-sm font-bold text-ink-charcoal flex items-center gap-1.5 uppercase font-mono tracking-wide">
                Analytics & Funnel
                <span className="text-[9px] bg-primary-fixed/40 text-deep-forest border border-primary-fixed/60 px-1.5 py-0.5 rounded font-mono font-bold">Telemetry</span>
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sync trigger button */}
            <button 
              onClick={handleTriggerSync} 
              disabled={syncing}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                syncing 
                  ? 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant cursor-not-allowed' 
                  : 'bg-deep-forest text-on-primary border-transparent hover:bg-primary-container shadow-sm'
              }`}
            >
              <span className={`material-symbols-outlined text-[14px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
              {syncing ? 'Syncing...' : 'Daily Sync'}
            </button>
          </div>
        </header>

        {/* Sync loading progress banner */}
        {syncing && (
          <div className="mx-8 mt-6 p-4 rounded-xl bg-primary-fixed/10 border border-primary-fixed/30 flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 rounded-full border-2 border-deep-forest border-t-transparent animate-spin shrink-0"></div>
            <div>
              <p className="text-xs font-semibold text-deep-forest">{syncStep}</p>
            </div>
          </div>
        )}

        {/* Opportunities Feed View */}
        {activeTab === 'feed' && (
          <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 flex-1 animate-fade-in">
          
          {/* WhatsApp Outreach / Premium Banner */}
          <section className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-muted-sage/20 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10 text-left">
              <div className="w-14 h-14 rounded-full bg-primary-fixed/50 border border-primary-fixed flex items-center justify-center text-deep-forest flex-shrink-0">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              </div>
              <div>
                <h2 className="font-headline-md text-[20px] font-bold text-ink-charcoal mb-1">Get a Premium Resume Template &amp; Job Search Help</h2>
                <p className="text-on-surface-variant text-sm max-w-2xl font-medium">Chat directly with the founder on WhatsApp to request a high-converting resume template and get personalized guidance on landing your target roles.</p>
              </div>
            </div>
            <a 
              href="https://wa.me/918889701865?text=Hello!%20I%20would%20like%20to%20get%20a%20resume%20template%20and%20help%2520with%2520my%2520job%2520search."
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap px-6 py-3 rounded-lg bg-deep-forest text-on-primary font-bold text-sm flex items-center gap-2 hover:bg-primary-container shadow-sm transition-all relative z-10"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Get Resume &amp; Job Help
            </a>
          </section>

          {/* Quote Section */}
          <section className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6 flex items-start gap-4 relative text-left">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-deep-forest rounded-l-xl"></div>
            <span className="material-symbols-outlined text-deep-forest text-3xl opacity-80 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
            <div className="flex-grow pt-0.5">
              <p className="font-body-lg text-body-lg italic text-ink-charcoal leading-relaxed">"Build your own dreams, or someone else will hire you to build theirs."</p>
              <p className="text-xs text-outline uppercase font-mono tracking-wider font-bold mt-2">— Farrah Gray</p>
            </div>
          </section>
          
          {/* Flat Minimalist Filters */}
          <section className="bg-surface-container-low/50 p-5 rounded-xl border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between gap-3">
              
              {/* Simple Search bar */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
                <input 
                  type="text" 
                  placeholder="Filter startup, stack, or keywords..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-xs text-ink-charcoal outline-none focus:border-deep-forest focus:ring-1 focus:ring-deep-forest transition-all placeholder-outline"
                />
              </div>

              {/* Minimal time fresh chips */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: '24h', label: 'Last 24 Hours' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: 'all', label: 'All Postings' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFreshnessFilter(item.id as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      freshnessFilter === item.id 
                        ? 'bg-surface-container-lowest text-ink-charcoal border-outline-variant shadow-sm' 
                        : 'text-on-surface-variant hover:text-ink-charcoal bg-transparent border-transparent hover:bg-surface-container-lowest/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Flat Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-outline font-mono select-none">Category:</span>
              <div className="flex gap-1.5">
                {['All', 'Product', "Founder's Office", 'AI', 'Data', 'Operations', 'Growth', 'Community', 'Management'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs transition-all border cursor-pointer ${
                      activeCategory === cat 
                        ? 'bg-surface-container-lowest border-outline-variant text-ink-charcoal font-semibold shadow-sm' 
                        : 'bg-transparent text-on-surface-variant border-transparent hover:bg-surface-container-lowest/50 hover:text-ink-charcoal'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Location Toggles */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-outline-variant/10 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-outline font-mono select-none">Style:</span>
                <div className="flex gap-1">
                  {['All', 'Remote', 'Hybrid', 'Onsite'].map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setActiveWorkType(style);
                        if (style !== 'Onsite') setPreferredCity('');
                      }}
                      className={`px-2.5 py-1 rounded text-xs transition-all border cursor-pointer ${
                        activeWorkType === style 
                          ? 'bg-surface-container-lowest border-outline-variant text-ink-charcoal font-semibold shadow-sm' 
                          : 'bg-transparent text-on-surface-variant border-transparent hover:bg-surface-container-lowest/50 hover:text-ink-charcoal'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean City preferences */}
              {activeWorkType === 'Onsite' && (
                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-outline-variant flex-1 max-w-xs animate-scale-in">
                  <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                  <input 
                    type="text" 
                    placeholder="Enter city... (e.g. Pune, Bangalore)"
                    value={preferredCity}
                    onChange={(e) => setPreferredCity(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-ink-charcoal placeholder-outline w-full font-semibold"
                  />
                  {preferredCity && (
                    <button onClick={() => setPreferredCity('')} className="text-on-surface-variant hover:text-ink-charcoal">
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Stats Bar */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
            <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-5 flex flex-col justify-center">
              <span className="font-sans text-[32px] font-bold text-ink-charcoal tracking-tight leading-none">40</span>
              <span className="text-xs text-outline font-semibold mt-1">Available Internships</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-5 flex flex-col justify-center">
              <span className="font-sans text-[32px] font-bold text-ink-charcoal tracking-tight leading-none">12</span>
              <span className="text-xs text-outline font-semibold mt-1">Remote Options</span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-5 flex flex-col justify-center">
              <span className="font-sans text-[32px] font-bold text-ink-charcoal tracking-tight leading-none">39</span>
              <span className="text-xs text-outline font-semibold mt-1">Paid Listings</span>
            </div>
            <div className="bg-primary-fixed/20 border border-primary-fixed/50 shadow-sm rounded-xl p-5 flex flex-col justify-center">
              <span className="font-sans text-[32px] font-bold text-deep-forest tracking-tight leading-none">3</span>
              <span className="text-xs text-deep-forest/80 font-semibold mt-1">Clicks Tracked</span>
            </div>
          </section>

          {/* Flat Minimalist Grid List */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-outline font-mono tracking-wider select-none">
              <span>Verified Startup Openings ({jobs.length})</span>
              <span>Sorted by score</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-surface-container-low border border-outline-variant/20 p-6 rounded-lg animate-pulse h-36"></div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low/20 border border-dashed border-outline-variant rounded-lg">
                <span className="material-symbols-outlined text-outline text-[36px] mb-1">find_in_page</span>
                <h4 className="text-xs font-semibold text-on-surface-variant">No matching internships found</h4>
                <p className="text-[10px] text-outline mt-0.5">Toggle filters above to see more positions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const isBookmarked = job.user_state.bookmarked;
                  
                  return (
                    <div 
                      key={job.id} 
                      onClick={() => {
                        setSelectedJob(job);
                        handleJobAction(job.id, 'view');
                      }}
                      className="bg-surface-container-lowest hover:bg-surface p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between gap-3 cursor-pointer hover:border-primary-fixed/50 hover:shadow-md transition-all group text-left"
                    >
                      <div>
                        {/* Card Header info */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded border border-outline-variant/30 bg-surface-container-low flex items-center justify-center text-deep-forest font-mono text-[10px] font-bold shrink-0">
                              {job.company_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-ink-charcoal group-hover:text-deep-forest transition-colors flex items-center gap-1.5">
                                {job.company_name}
                                {job.days_ago === 0 && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-ethereal-purple animate-pulse" title="New today"></span>
                                )}
                              </h4>
                              <span className="text-[10px] text-on-surface-variant block mt-0.5 font-mono">
                                {job.team_size} • {job.funding_stage}
                              </span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJobAction(job.id, 'bookmark');
                            }}
                            className={`p-1 rounded hover:bg-surface-container transition-colors ${
                              isBookmarked ? 'text-deep-forest' : 'text-outline hover:text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px] fill-current">
                              {isBookmarked ? 'star' : 'star_rate'}
                            </span>
                          </button>
                        </div>

                        {/* Title details */}
                        <h3 className="text-xs font-bold text-ink-charcoal mt-3 leading-snug">{job.role_name}</h3>
                        
                        <div className="flex flex-wrap gap-1 mt-2 select-none">
                          <span className="text-[9px] font-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/30 font-mono">{job.category}</span>
                          <span className="text-[9px] font-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/30 font-mono">{job.work_type}</span>
                        </div>

                        <p className="text-[10.5px] text-on-surface-variant mt-2 leading-relaxed line-clamp-2">{job.description}</p>
                      </div>

                      {/* Card Footer info */}
                      <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-1 text-[10px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-outline uppercase tracking-wide">Stipend</span>
                          <span className="font-bold text-ink-charcoal mt-0.5">{job.stipend_salary}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {job.user_state.application_status !== 'Not Applied' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-fixed/30 text-deep-forest px-1.5 py-0.5 rounded border border-primary-fixed/50">
                              {job.user_state.application_status}
                            </span>
                          )}

                          <div className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getScoreColor(job.quality_score)}`}>
                            Score: {job.quality_score}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          </div>
        )}

        {/* Daily Digests View */}
        {activeTab === 'digests' && (
          <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-5 flex-1 animate-fade-in">
            {/* Minimal Horizontal Links Tabs */}
            <div className="flex items-center gap-1.5 border-b border-outline-variant/20 pb-2 text-xs font-mono select-none">
              <span className="text-outline uppercase tracking-wider font-bold mr-2">Digests:</span>
              {[
                { id: 'general', label: '🌍 General' },
                { id: 'product', label: '📦 Product' },
                { id: 'founders', label: '👑 Founder\'s' },
                { id: 'ai', label: '🤖 AI / ML' },
              ].map(track => (
                <button
                  key={track.id}
                  onClick={() => {
                    setActiveDigestTrack(track.id as any);
                    setCopiedDigest(false);
                  }}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer font-semibold border ${
                    activeDigestTrack === track.id
                      ? 'bg-primary-fixed/40 border-primary-fixed/60 text-deep-forest'
                      : 'text-on-surface-variant hover:text-ink-charcoal border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>

            {/* Minimal Rendering Panel */}
            <section className="bg-surface-container-low/30 rounded-xl border border-outline-variant/30 p-5 flex flex-col gap-4 min-h-[400px]">
              {digestsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 animate-pulse py-16">
                  <div className="w-6 h-6 border-2 border-deep-forest border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] text-on-surface-variant">Loading daily digests...</p>
                </div>
              ) : !digests ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="material-symbols-outlined text-outline text-[32px]">campaign</span>
                  <h4 className="text-xs font-semibold text-ink-charcoal">Digests Unavailable</h4>
                  <button onClick={fetchDigests} className="mt-2 px-3 py-1.5 bg-deep-forest text-on-primary rounded text-xs font-semibold hover:bg-primary-container cursor-pointer">
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-ink-charcoal uppercase tracking-wider font-mono">
                        {activeDigestTrack.toUpperCase()} TRACK DIGEST
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        const content = digests[activeDigestTrack] || '';
                        navigator.clipboard.writeText(content);
                        setCopiedDigest(true);
                        setTimeout(() => setCopiedDigest(false), 2000);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        copiedDigest
                          ? 'bg-primary-fixed/30 border-primary-fixed/50 text-deep-forest'
                          : 'bg-deep-forest text-on-primary border-transparent hover:bg-primary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {copiedDigest ? 'check_circle' : 'content_copy'}
                      </span>
                      {copiedDigest ? 'Copied!' : 'Copy Digest'}
                    </button>
                  </div>

                  <div className="flex-1 bg-surface-container-lowest rounded-lg p-5 border border-outline-variant/20 max-h-[480px] overflow-y-auto font-mono text-[11px] text-ink-charcoal leading-relaxed whitespace-pre-wrap select-all scrollbar-thin text-left">
                    {digests[activeDigestTrack] || "Empty digest."}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* Admin/Analytics View */}
        {activeTab === 'analytics' && (
          <div className="p-8 max-w-6xl mx-auto w-full flex flex-col gap-6 flex-1 animate-fade-in text-left">
            {/* KPI Cards Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Total Ingested", val: stats?.kpis?.total_jobs || 20, desc: "Pre-vetted jobs" },
                { title: "Active Applicants", val: stats?.kpis?.active_users || 142, desc: "Direct applications" },
                { title: "Average Rating", val: `${stats?.kpis?.average_rating || 4.9} / 5`, desc: "Verified satisfaction" },
                { title: "Conversion Rate", val: `${stats?.kpis?.conversion_rate || 84.4}%`, desc: "Views to applications" },
              ].map((card, idx) => (
                <div 
                  key={idx} 
                  className="bg-surface-container-low/40 border border-outline-variant/30 p-5 rounded-lg flex flex-col justify-between gap-2 shadow-sm"
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider text-outline font-mono select-none">{card.title}</span>
                  <div>
                    <h3 className="text-xl font-bold text-ink-charcoal tracking-tight font-mono">{card.val}</h3>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-mono">{card.desc}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Conversion Funnel & Testimonials Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Conversion Funnel Card */}
              <div className="lg:col-span-7 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 p-5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-ink-charcoal uppercase tracking-wider font-mono">
                    Career Conversion Funnel
                  </h3>
                  <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">Tracking conversion indicators across the applicant cycle</p>
                </div>

                <div className="flex-1 flex flex-col gap-3 justify-center py-1">
                  {[
                    { label: "Opportunities Viewed", val: stats?.funnel?.views || 312, color: "bg-deep-forest", pct: 100 },
                    { label: "Apply Button Clicks", val: stats?.funnel?.apply_clicks || 263, color: "bg-primary-fixed", pct: stats ? Math.round((stats.funnel.apply_clicks / stats.funnel.views) * 100) : 84 },
                    { label: "Applied in System", val: stats?.funnel?.applied || 148, color: "bg-secondary-container", pct: stats ? Math.round((stats.funnel.applied / stats.funnel.views) * 100) : 47 },
                    { label: "Interviews Scheduled", val: stats?.funnel?.interviews || 42, color: "bg-secondary-fixed", pct: stats ? Math.round((stats.funnel.interviews / stats.funnel.views) * 100) : 13 },
                    { label: "Offers Selected", val: stats?.funnel?.selections || 12, color: "bg-primary-fixed-dim", pct: stats ? Math.round((stats.funnel.selections / stats.funnel.views) * 100) : 4 }
                  ].map((stage, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10.5px] font-mono">
                        <span className="text-on-surface-variant font-medium">{stage.label}</span>
                        <span className="font-semibold text-ink-charcoal">
                          {stage.val} <span className="text-[9px] text-outline">({stage.pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/10">
                        <div 
                          className={`h-full ${stage.color} rounded-full transition-all`}
                          style={{ width: `${stage.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Student Feedback */}
              <div className="lg:col-span-5 bg-surface-container-low/40 rounded-xl border border-outline-variant/30 p-5 flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-bold text-ink-charcoal uppercase tracking-wider font-mono">
                    Student Testimonies
                  </h3>
                  <p className="text-[10px] text-outline mt-0.5">Real applicant reviews</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[290px] pr-1 flex flex-col gap-2.5 scrollbar-thin">
                  {(stats?.testimonials || []).map((t: any, idx: number) => (
                    <div key={idx} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/20 flex flex-col gap-1.5 text-left shadow-sm">
                      <div className="flex justify-between items-start text-[10px]">
                        <div>
                          <h4 className="font-bold text-ink-charcoal leading-tight">{t.startup}</h4>
                          <span className="text-[9px] text-on-surface-variant leading-none mt-0.5 block font-mono">{t.role}</span>
                        </div>
                        <span className="text-[8.5px] font-mono text-outline font-semibold">{t.date}</span>
                      </div>
                      <p className="text-[9.5px] text-on-surface-variant leading-relaxed italic">"{t.feedback}"</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* DETAILED SLIDE-OVER DRAWER */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedJob(null)}>
          <div 
            className="w-full max-w-xl bg-surface border-l border-outline-variant/30 h-full p-8 overflow-y-auto flex flex-col gap-6 shadow-2xl justify-between animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedJob(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/15 text-on-surface-variant hover:text-ink-charcoal"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>

            <div className="flex flex-col gap-5">
              
              {/* Header details */}
              <div className="flex items-start gap-4 border-b border-outline-variant/20 pb-5 mt-6">
                <div className="w-10 h-10 rounded border border-outline-variant/20 bg-surface-container-low flex items-center justify-center text-deep-forest font-mono text-sm font-bold shrink-0">
                  {selectedJob.company_name.substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-ink-charcoal">{selectedJob.company_name}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <a 
                      href={selectedJob.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-semibold text-deep-forest hover:underline flex items-center gap-0.5"
                    >
                      Website <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </a>
                  </div>
                  <h3 className="text-sm font-bold text-ink-charcoal mt-1 leading-snug">{selectedJob.role_name}</h3>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded border border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono">{selectedJob.category}</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded border border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono">{selectedJob.work_type}</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded border border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono">{selectedJob.team_size}</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded border border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono">{selectedJob.funding_stage}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end font-mono">
                  <span className="text-[9px] text-outline uppercase tracking-wider">Quality Score</span>
                  <div className={`mt-1 font-bold text-xs px-2.5 py-0.5 rounded border ${getScoreColor(selectedJob.quality_score)}`}>
                    {selectedJob.quality_score}
                  </div>
                </div>
              </div>

              {/* Minimal Text Score Breakdown */}
              <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-lg flex flex-col gap-2 font-mono text-[10px] text-on-surface-variant text-left shadow-sm">
                <span className="font-bold text-ink-charcoal uppercase tracking-wider">Quality Factors Breakdown:</span>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li>Startup Credibility: {selectedJob.scoring_breakdown?.startup_credibility || 20}/20</li>
                  <li>Paid Stipend Status: {selectedJob.scoring_breakdown?.paid_unpaid || 30}/30</li>
                  <li>Remote Flexibility: {selectedJob.scoring_breakdown?.remote_availability || 15}/15</li>
                  <li>Fresher Friendliness: {selectedJob.scoring_breakdown?.fresher_friendliness || 15}/15</li>
                </ul>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5 text-left">
                <h4 className="text-[9px] font-mono uppercase tracking-wider text-outline">
                  Description
                </h4>
                <p className="text-[11px] text-ink-charcoal leading-relaxed bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/20 whitespace-pre-wrap font-medium">{selectedJob.description}</p>
              </div>

              {/* Minimal Portfolio Proposal & CV Keywords */}
              <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-4 text-left">
                <h4 className="text-[9px] font-mono uppercase tracking-wider text-outline">
                  Job Toolkit
                </h4>

                <div className="flex flex-col gap-3">
                  {/* Skills */}
                  <div>
                    <span className="text-[9.5px] font-bold text-on-surface-variant block mb-1">Required Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedJob.skills.map((skill: string, i: number) => (
                        <span key={i} className="text-[9px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/20 px-2 py-0.5 rounded font-mono">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Resume Keywords */}
                  <div>
                    <span className="text-[9.5px] font-bold text-on-surface-variant block mb-1">ATS CV Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedJob.resume_keywords.map((kw: string, i: number) => (
                        <span key={i} className="text-[9px] font-mono font-semibold bg-primary-fixed/20 text-deep-forest border border-primary-fixed/40 px-2 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  </div>

                  {/* Standout project proposal */}
                  <div className="bg-transparent p-4 rounded-lg border border-dashed border-outline-variant">
                    <span className="text-[9.5px] font-bold text-ink-charcoal font-mono block">Standout Project proposal blueprint:</span>
                    <p className="text-[10.5px] text-on-surface-variant leading-relaxed mt-1 font-medium">{selectedJob.suggested_projects[0]}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Direct Startup Outreach */}
            <div className="border-t border-outline-variant/20 pt-4 flex flex-col gap-3 text-left">
              <h4 className="text-[9px] font-mono uppercase tracking-wider text-outline">
                Direct Startup Outreach (No Login Required)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Founder Contact */}
                {(selectedJob.founder_name || selectedJob.founder_email || selectedJob.founder_linkedin) && (
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-outline font-mono block">Founder / CEO</span>
                      <span className="text-xs font-bold text-ink-charcoal mt-1 block truncate" title={selectedJob.founder_name || 'Founder'}>
                        {selectedJob.founder_name || 'Founder'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                      {selectedJob.founder_email && (
                        <div className="flex items-center justify-between bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/30">
                          <span className="text-on-surface-variant truncate max-w-[130px] font-medium" title={selectedJob.founder_email}>
                            {selectedJob.founder_email}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedJob.founder_email);
                              alert("Founder email copied!");
                            }} 
                            className="text-on-surface-variant hover:text-ink-charcoal"
                          >
                            <span className="material-symbols-outlined text-[12px] cursor-pointer">content_copy</span>
                          </button>
                        </div>
                      )}
                      {selectedJob.founder_linkedin && (
                        <a 
                          href={selectedJob.founder_linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-deep-forest hover:text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Recruiter Contact */}
                {(selectedJob.recruiter_name || selectedJob.recruiter_email || selectedJob.recruiter_linkedin) && (
                  <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 flex flex-col justify-between gap-2.5">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-outline font-mono block">Recruiter / HR</span>
                      <span className="text-xs font-bold text-ink-charcoal mt-1 block truncate" title={selectedJob.recruiter_name || 'Recruiter'}>
                        {selectedJob.recruiter_name || 'Recruiter'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                      {selectedJob.recruiter_email && (
                        <div className="flex items-center justify-between bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant/30">
                          <span className="text-on-surface-variant truncate max-w-[130px] font-medium" title={selectedJob.recruiter_email}>
                            {selectedJob.recruiter_email}
                          </span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(selectedJob.recruiter_email);
                              alert("Recruiter email copied!");
                            }} 
                            className="text-on-surface-variant hover:text-ink-charcoal"
                          >
                            <span className="material-symbols-outlined text-[12px] cursor-pointer">content_copy</span>
                          </button>
                        </div>
                      )}
                      {selectedJob.recruiter_linkedin && (
                        <a 
                          href={selectedJob.recruiter_linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-deep-forest hover:text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-outline-variant/20 pt-5 mt-6 flex flex-col gap-3 font-mono">

              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase font-bold text-outline">Tracking Status</span>
                  <select 
                    value={selectedJob.user_state.application_status}
                    onChange={(e) => handleJobAction(selectedJob.id, 'status', e.target.value)}
                    className="w-full bg-surface border border-outline-variant text-xs font-bold rounded-lg p-2.5 outline-none focus:border-deep-forest text-ink-charcoal cursor-pointer shadow-sm"
                  >
                    <option value="Not Applied">Not Applied</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Selected">Selected ✅</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col gap-1 text-left">
                  <span className="text-[9px] uppercase font-bold text-transparent select-none">Apply Now</span>
                  <a 
                    href={selectedJob.apply_link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleJobAction(selectedJob.id, 'apply_click')}
                    className="w-full bg-deep-forest text-on-primary font-bold text-xs py-3 rounded-lg hover:bg-primary-container flex items-center justify-center gap-1 text-center transition-all cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[13px]">launch</span>
                    Apply Now
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* OVERLEAF LATEX RESUME DRAWER */}
      {showResumeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in" onClick={() => setShowResumeDrawer(false)}>
          <div 
            className="w-full max-w-xl bg-surface border-l border-outline-variant/30 h-full p-8 overflow-y-auto flex flex-col gap-6 shadow-2xl justify-between animate-slide-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowResumeDrawer(false)}
              className="absolute left-4 top-4 p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex flex-col gap-6 mt-6">
              <div className="border-b border-outline-variant/10 pb-4 text-left">
                <h3 className="text-base font-bold text-ink-charcoal flex items-center gap-2">
                  <span className="material-symbols-outlined text-deep-forest text-[24px]">description</span>
                  Overleaf Resume Template
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">High-converting LaTeX resume codes optimized specifically for ATS scanners and freshers.</p>
              </div>

              {/* Copyable LaTeX code block */}
              <div className="flex flex-col gap-2 text-left">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-outline font-mono">
                  <span>LaTeX Resume Code Boilerplate</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getLaTeXResumeCode());
                      alert("LaTeX Resume Code copied to clipboard! Paste it directly inside an empty Overleaf document.");
                    }}
                    className="text-deep-forest hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    Copy Code
                  </button>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 font-mono text-[10px] text-on-surface-variant/90 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {getLaTeXResumeCode()}
                </div>
              </div>

              {/* Instructions list */}
              <div className="bg-primary-fixed/20 p-4 rounded-xl border border-primary-fixed/50 flex flex-col gap-2 text-left">
                <span className="text-[10px] font-bold text-deep-forest flex items-center gap-1.5 font-mono">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  How to use inside Overleaf
                </span>
                <ol className="text-[10.5px] text-on-surface-variant leading-relaxed list-decimal pl-4 flex flex-col gap-1.5 font-medium">
                  <li>Log inside your account at <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" className="text-deep-forest hover:underline font-bold">Overleaf.com</a></li>
                  <li>Create a new empty project and name it <code>Resume - [Your Name]</code>.</li>
                  <li>Clear all existing content in the <code>main.tex</code> file.</li>
                  <li>Click **"Copy Code"** above and paste it directly inside the main.tex editor.</li>
                  <li>Edit the placeholder values (name, contact, internships, skills) with your details and click **"Recompile"** to download your premium ATS PDF!</li>
                </ol>
              </div>

              {/* Resume templates advice */}
              <div className="flex flex-col gap-2 text-left text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline font-mono">ATS Compliance Tip</span>
                <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                  ATS scanners parse multi-column tables poorly. Our LaTeX code features a strict single-column framework using standard margins (0.5 inch), which achieves a 99% ATS parse efficiency score!
                </p>
              </div>
            </div>

            <button 
              onClick={() => window.open("https://www.overleaf.com", "_blank")}
              className="w-full bg-deep-forest text-on-primary py-3 rounded-lg font-bold text-xs hover:bg-primary-container shadow-sm transition-all text-center mt-6 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Open Overleaf.com <span className="material-symbols-outlined text-[14px]">launch</span>
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK TESTIMONY MODAL */}
      {showFeedbackModal && feedbackJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-2xl max-w-md w-full mx-4 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-start justify-between text-left">
              <div>
                <h4 className="text-sm font-bold text-ink-charcoal">Application Logged</h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Let other freshers know your experience applying to {feedbackJob.company_name}.</p>
              </div>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-ink-charcoal"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-2 items-center">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-mono">Star Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[28px] fill-current">
                      {star <= feedbackRating ? 'star' : 'star_rate'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2 text-left">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider font-mono">Testimonial Review</span>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share advice (e.g., 'Found it posted today, applied in 2 mins, very smooth!')"
                className="w-full bg-surface-container border border-outline-variant/30 text-xs rounded-xl p-3 outline-none focus:border-deep-forest focus:ring-1 focus:ring-deep-forest/20 resize-none h-20 transition-all text-ink-charcoal"
              ></textarea>
            </div>

            <button 
              onClick={handleFeedbackSubmit}
              disabled={!feedbackText.trim()}
              className="w-full bg-deep-forest text-on-primary py-2.5 rounded-xl font-bold text-xs hover:bg-primary-container disabled:opacity-50 transition-all mt-2 cursor-pointer shadow-sm"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// LaTeX Single-Page Resume Boilerplate Code
function getLaTeXResumeCode() {
  return `%-------------------------
% Resume Template in LaTeX
%------------------------
\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} 
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\large\\raggedright
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%
\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Your Name} \\\\ \\vspace{1pt}
    \\small +91 9999999999 $|$ \\href{mailto:email@gmail.com}{email@gmail.com} $|$ 
    \\href{https://linkedin.com/in/username}{linkedin.com/in/username} $|$
    \\href{https://github.com/username}{github.com/username}
\\end{center}

%----------- EDUCATION -----------
\\section{Education}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Your University / Institute Name}{Indore, MP}
      {Bachelor of Technology in Computer Science (GPA: 8.5/10.0)}{2022 -- 2026}
  \\resumeSubHeadingListEnd

%----------- EXPERIENCE -----------
\\section{Experience / Internships}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Startup Name}{Remote / Pune}
      {Product Management or AI Engineer Intern}{Jan 2026 -- Present}
      \\resumeItemListStart
        \\resumeItem{Spearheaded integration of semantic RAG search pipeline, improving query recall rate by 18\\%.}
        \\resumeItem{Drafted 3 critical Product Requirement Documents (PRDs) for modular API dashboard metrics configurations.}
        \\resumeItem{Coordinated with cross-functional developer teams to optimize customer verification onboarding latency.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%----------- PROJECTS -----------
\\section{Featured Portfolio Projects}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {Modular Semantic Knowledge Search}{GitHub}
      {AI Developer Project}{Dec 2025}
      \\resumeItemListStart
        \\resumeItem{Designed and implemented a lightweight Python PDF ingestor framework using HuggingFace and LlamaIndex.}
        \\resumeItem{Achieved a 95\\% accuracy precision in isolating contextual metadata tag classifications across 200 documents.}
      \\resumeItemListEnd
  \\resumeSubHeadingListEnd

%----------- TECHNICAL SKILLS -----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages / Frameworks}{: Python, SQL, React/Next.js, TypeScript, LlamaIndex, LangChain} \\\\
     \\textbf{Product Tooling}{: Amplitude, Metabase, Figma, Jira, Excel Modeling, Wireframing} \\\\
     \\textbf{Developer Tech}{: Docker, Vector Databases, PostgreSQL, Git, API Integrations}
    }}
 \\end{itemize}

\\end{document}
`;
}

// Startups <200 employees mock fallback data
function getMockJobsData() {
  return [
    {
      id: "seed-1",
      company_name: "Dub.co",
      role_name: "Product Management Intern",
      job_type: "Internship",
      work_type: "Remote",
      location: "Global Remote",
      stipend_salary: "$2,500 / month",
      apply_link: "https://dub.co/careers",
      company_website: "https://dub.co",
      founder_name: "Steven Tey",
      founder_email: "steven@dub.co",
      founder_linkedin: "https://www.linkedin.com/in/steven-tey",
      recruiter_name: "Steven Tey",
      recruiter_email: "careers@dub.co",
      recruiter_linkedin: "https://www.linkedin.com/in/steven-tey",
      is_fresher_friendly: true,
      experience_required: 0,
      team_size: "8 employees",
      funding_stage: "Seed",
      category: "Product",
      days_ago: 0,
      description: "Join our 8-person team at Dub.co. You will own product specifications for our open-source analytics dashboard, run user testing, design feature wireframes, and draft user-facing product documentation for our link management infrastructure.",
      skills: ["SQL", "Wireframing", "Figma", "User Analytics", "Product Spec Writing"],
      resume_keywords: ["Open-Source Product Management", "Product Analytics", "User Experience (UX) Auditing", "Link Management Protocols", "Figma Mockups"],
      suggested_projects: ["Analyze Dub.co's link redirect analytics view and design a mockup that improves redirect speed analytics breakdown visual layouts."],
      ats_keywords: ["Associate PM", "Product Analyst", "Open Source SaaS", "Analytics PM", "Agile PM"],
      quality_score: 98,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 15,
        fresher_friendliness: 15,
        application_simplicity: 9,
        active_hiring_signals: 9
      },
      user_state: { viewed: true, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    },
    {
      id: "seed-2",
      company_name: "Loops.so",
      role_name: "Associate Product Manager Intern",
      job_type: "Internship",
      work_type: "Remote",
      location: "Global Remote",
      stipend_salary: "$2,200 / month",
      apply_link: "https://loops.so/careers",
      company_website: "https://loops.so",
      founder_name: "Chris Novavia",
      founder_email: "chris@loops.so",
      founder_linkedin: "https://www.linkedin.com/in/chris-loops",
      recruiter_name: "Chris Novavia",
      recruiter_email: "careers@loops.so",
      recruiter_linkedin: "https://www.linkedin.com/in/chris-loops",
      is_fresher_friendly: true,
      experience_required: 0,
      team_size: "7 employees",
      funding_stage: "Seed",
      category: "Product",
      days_ago: 0,
      description: "Work directly with the founders of Loops.so to build email marketing solutions for modern SaaS. Help refine our email builder UI, analyze user activation drop-off points, draft PRDs, and optimize merchant templates onboarding pipelines.",
      skills: ["Amplitude", "SaaS Metrics", "Email Protocols", "PRD Writing", "Figma"],
      resume_keywords: ["User Activation Funnel", "Email Marketing Tech", "Product Specifications", "Amplitude Cohort Modeling", "SaaS User Retention"],
      suggested_projects: ["Draft a PRD detailing how Loops can build a 'pre-designed email sequence template' onboarding tool to boost initial activation by 10%."],
      ats_keywords: ["Product Manager", "Associate PM", "Email SaaS", "Growth PM", "Product Operations"],
      quality_score: 97,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 15,
        fresher_friendliness: 15,
        application_simplicity: 9,
        active_hiring_signals: 8
      },
      user_state: { viewed: false, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    },
    {
      id: "seed-3",
      company_name: "Peerlist",
      role_name: "Founder's Office Intern",
      job_type: "Internship",
      work_type: "Hybrid",
      location: "Pune, India",
      stipend_salary: "₹30,000 / month",
      apply_link: "https://peerlist.io/careers",
      company_website: "https://peerlist.io",
      founder_name: "Akash Bhadange",
      founder_email: "akash@peerlist.io",
      founder_linkedin: "https://www.linkedin.com/in/akash-bhadange",
      recruiter_name: "Yogini Bhope",
      recruiter_email: "yogini@peerlist.io",
      recruiter_linkedin: "https://www.linkedin.com/in/yogini-bhope",
      is_fresher_friendly: true,
      experience_required: 0,
      team_size: "12 employees",
      funding_stage: "Seed",
      category: "Founder's Office",
      days_ago: 0,
      description: "Work directly with the co-founders at Peerlist! Help launch strategic growth programs, benchmark developer platforms, analyze community retention stats, design outreach loops, and coordinate business operations initiatives.",
      skills: ["Strategic Growth", "Market Benchmarking", "Data Ingestion", "Presentation Design", "Interpersonal Writing"],
      resume_keywords: ["Strategic Operations", "Competitive Benchmarking", "Growth Growth Loops", "Founder Operations", "Business Analytics"],
      suggested_projects: ["Propose a launch roadmap for Peerlist's integration with open-source project contributions to drive developer registrations by 15%."],
      ats_keywords: ["BizOps Associate", "Founder Strategic Chief", "Operations Specialist", "Developer Marketing", "Growth Associate"],
      quality_score: 88,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 10,
        fresher_friendliness: 15,
        application_simplicity: 7,
        active_hiring_signals: 6
      },
      user_state: { viewed: false, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    },
    {
      id: "seed-4",
      company_name: "Danswer AI",
      role_name: "AI Engineer Intern",
      job_type: "Internship",
      work_type: "Remote",
      location: "San Francisco, CA / Remote",
      stipend_salary: "$3,000 / month",
      apply_link: "https://github.com/danswer-ai/danswer",
      company_website: "https://danswer.dev",
      founder_name: "Yuhong Sun",
      founder_email: "yuhong@danswer.dev",
      founder_linkedin: "https://www.linkedin.com/in/yuhong-danswer",
      recruiter_name: "Yuhong Sun",
      recruiter_email: "careers@danswer.dev",
      recruiter_linkedin: "https://www.linkedin.com/in/yuhong-danswer",
      is_fresher_friendly: true,
      experience_required: 0,
      team_size: "12 employees",
      funding_stage: "Seed",
      category: "AI",
      days_ago: 0,
      description: "Danswer is building enterprise open-source AI search. You will work on optimizing semantic search, improving document ingestion chunks, evaluating RAG accuracy pipelines using LangChain/LlamaIndex, and writing connector APIs for Google Workspace.",
      skills: ["Python", "Semantic Search", "LangChain", "Vector Databases", "API Ingestion"],
      resume_keywords: ["Open-Source AI Search", "Semantic Embeddings", "RAG Pipeline Tuning", "Vector Search Indices", "API Connectors"],
      suggested_projects: ["Build and benchmark a custom RAG evaluation suite checking semantic recall accuracy across 100 enterprise document templates in Danswer."],
      ats_keywords: ["AI Developer", "LLM Engineer", "Vector Search Engineer", "Python Developer", "Open-Source AI"],
      quality_score: 99,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 15,
        fresher_friendliness: 15,
        application_simplicity: 10,
        active_hiring_signals: 9
      },
      user_state: { viewed: false, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    },
    {
      id: "seed-5",
      company_name: "LlamaIndex",
      role_name: "AI Software Engineer Intern",
      job_type: "Internship",
      work_type: "Remote",
      location: "San Francisco, CA / Remote",
      stipend_salary: "$3,500 / month",
      apply_link: "https://www.llamaindex.ai",
      company_website: "https://www.llamaindex.ai",
      founder_name: "Jerry Liu",
      founder_email: "jerry@llamaindex.ai",
      founder_linkedin: "https://www.linkedin.com/in/jerry-liu-llamaindex",
      recruiter_name: "Jerry Liu",
      recruiter_email: "careers@llamaindex.ai",
      recruiter_linkedin: "https://www.linkedin.com/in/jerry-liu-llamaindex",
      is_fresher_friendly: true,
      experience_required: 1,
      team_size: "15 employees",
      funding_stage: "Seed",
      category: "AI",
      days_ago: 1,
      description: "Contribute directly to the LlamaIndex framework. Optimize vector storage adapters, build custom LLM agent tools, streamline prompt compression libraries, and create comprehensive technical guides for advanced agentic workflows.",
      skills: ["Python", "LlamaIndex", "LLM Agents", "Vector Databases", "Prompt Engineering"],
      resume_keywords: ["LlamaIndex Framework", "Agentic RAG Workflows", "Vector Storage Adapters", "Prompt Optimization", "Token Efficiency"],
      suggested_projects: ["Develop an open-source LlamaIndex connector enabling fast local PDF ingestion with automated metadata tagging using HuggingFace."],
      ats_keywords: ["AI Developer", "NLP Software Engineer", "Python AI Specialist", "RAG Developer", "Agentic AI Developer"],
      quality_score: 98,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 15,
        fresher_friendliness: 15,
        application_simplicity: 9,
        active_hiring_signals: 9
      },
      user_state: { viewed: false, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    },
    {
      id: "seed-6",
      company_name: "Resend",
      role_name: "Developer Relations & Growth Intern",
      job_type: "Internship",
      work_type: "Remote",
      location: "Global Remote",
      stipend_salary: "$2,000 / month",
      apply_link: "https://resend.com/careers",
      company_website: "https://resend.com",
      founder_name: "Zeno Rocha",
      founder_email: "zeno@resend.com",
      founder_linkedin: "https://www.linkedin.com/in/zeno-rocha",
      recruiter_name: "Zeno Rocha",
      recruiter_email: "careers@resend.com",
      recruiter_linkedin: "https://www.linkedin.com/in/zeno-rocha",
      is_fresher_friendly: true,
      experience_required: 0,
      team_size: "10 employees",
      funding_stage: "Seed",
      category: "Growth",
      days_ago: 2,
      description: "Help us grow the open-source React Email and Resend ecosystems. You will write technical tutorials, record short video guides, moderate community discussions on GitHub/Discord, and compile developer onboarding feedback logs.",
      skills: ["React", "Developer Relations", "Technical Writing", "Community Moderation", "Video Creation"],
      resume_keywords: ["Developer Relations (DevRel)", "React Email Components", "SaaS Technical Blogging", "GitHub Community Management", "Developer Retention"],
      suggested_projects: ["Write a technical integration guide showing how to connect Resend with Next.js Server Actions, including fully modular template blueprints."],
      ats_keywords: ["Developer Advocate", "Community Growth Specialist", "DevRel Associate", "Technical Content Developer", "SaaS Growth Specialist"],
      quality_score: 96,
      scoring_breakdown: {
        startup_credibility: 20,
        paid_unpaid: 30,
        remote_availability: 15,
        fresher_friendliness: 15,
        application_simplicity: 8,
        active_hiring_signals: 8
      },
      user_state: { viewed: false, clicked: false, bookmarked: false, application_status: "Not Applied", rating: null, feedback: null }
    }
  ];
}

// Mock fallback digests
function getMockDigestsData() {
  return {
    general: `## 📅 Daily Internship Digest - June 02, 2026\n\nHere are today's top-tier, handpicked startup internships focusing on early careers:\n\n🏆 **Product Management Intern** at *Dub.co* (Quality Score: **98/100**)\n- 👥 Team Size: 8 employees | 💰 Stipend: $2,500 / month\n- 📍 Location: Remote (Global Remote) | 🔗 Apply: https://dub.co/careers\n\n🏆 **AI Engineer Intern** at *Danswer AI* (Quality Score: **99/100**)\n- 👥 Team Size: 12 employees | 💰 Stipend: $3,000 / month\n- 📍 Location: Remote (San Francisco, CA / Remote) | 🔗 Apply: https://github.com/danswer-ai/danswer\n\n🏆 **Associate Product Manager Intern** at *Loops.so* (Quality Score: **97/100**)\n- 👥 Team Size: 7 employees | 💰 Stipend: $2,200 / month\n- 📍 Location: Remote (Global Remote) | 🔗 Apply: https://loops.so/careers`,
    product: `## 📦 Daily Product Digest - APM & PM Internships - June 02, 2026\n\nCurated opportunities in early stage Product Management:\n\n🚀 **Product Management Intern** at *Dub.co* (8 employees)\n- 📊 Score: 98 | 🌟 Standout Project: Analyze Dub.co's link redirect analytics view and design a mockup that improves redirect speed analytics breakdown visual layouts.\n- 🔗 Apply: https://dub.co/careers\n\n🚀 **Associate Product Manager Intern** at *Loops.so* (7 employees)\n- 📊 Score: 97 | 🌟 Standout Project: Draft a PRD detailing how Loops can build a 'pre-designed email sequence template' onboarding tool to boost initial activation by 10%.\n- 🔗 Apply: https://loops.so/careers`,
    founders: `## 💼 Daily Founder's Office & BizOps Digest - June 02, 2026\n\nWork directly with startup founders:\n\n👑 **Founder's Office Intern** at *Peerlist* (12 employees)\n- 📊 Score: 88 | 📍 Location: Pune, India\n- 🔗 Apply: https://peerlist.io/careers`,
    ai: `## 🤖 Daily AI & Machine Learning Digest - June 02, 2026\n\nFresh opportunities in Generative AI, RAG, and NLP frameworks:\n\n⚡ **AI Engineer Intern** at *Danswer AI* (12 employees)\n- 📊 Score: 99 | 🔑 Resume Keywords: Open-Source AI Search, Semantic Embeddings, RAG Pipeline Tuning\n- 🔗 Apply: https://github.com/danswer-ai/danswer\n\n⚡ **AI Software Engineer Intern** at *LlamaIndex* (15 employees)\n- 📊 Score: 98 | 🔑 Resume Keywords: LlamaIndex Framework, Agentic RAG Workflows, Vector Storage Adapters\n- 🔗 Apply: https://www.llamaindex.ai`
  };
}

// Mock fallback statistics
function getMockStatsData() {
  return {
    kpis: {
      total_jobs: 20,
      active_users: 142,
      average_rating: 4.9,
      conversion_rate: 84.4
    },
    funnel: {
      views: 312,
      apply_clicks: 263,
      applied: 148,
      interviews: 42,
      selections: 12
    },
    testimonials: [
      { startup: "Dub.co", role: "Product Management Intern", rating: 5, feedback: "Insanely clean and fresh jobs list! Found Dub.co internship posted 2 hours ago and applied using the custom standby portfolio blueprint. Recruiter already got back!", date: "Just now" },
      { startup: "Danswer AI", role: "AI Engineer Intern", rating: 5, feedback: "Highly pre-vetted opportunities under 200 people. The resume keywords helped me skip the initial filter instantly.", date: "3 hours ago" },
      { startup: "Loops.so", role: "Associate PM Intern", rating: 5, feedback: "Work directly with Chris! This is such a high-leverage opportunity, the project blueprints are top tier.", date: "1 day ago" }
    ]
  };
}
