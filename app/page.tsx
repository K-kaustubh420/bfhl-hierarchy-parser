"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ChevronRight, Terminal, Database, TreeDeciduous, Info, AlertCircle } from "lucide-react";

type ViewMode = "tree" | "json" | "stats";

export default function Home() {
  const [input, setInput] = useState('{ "data": ["A->B", "A->C", "B->D", "C->E"] }');
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>("tree");

  const containerRef = useRef(null);

  useEffect(() => {
    gsap.from(".animate-in", {
      y: 20,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
    });
  }, []);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const body = JSON.parse(input);
      const r = await fetch("/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "System Error");
      setRes(data);
      // Animate results appearing
      gsap.from(".res-content", { opacity: 0, x: 10, duration: 0.4 });
    } catch (e: any) {
      setError(e.message || "Invalid JSON Input");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#161b22] text-[#e6edf3] font-sans selection:bg-[#ff4d4d] selection:text-white">
      {/* Background Large Text Decor */}
      <div className="fixed bottom-0 left-0 text-[15vw] font-black opacity-[0.03] select-none pointer-events-none leading-none -ml-4 uppercase">
        Parser
      </div>

      <div ref={containerRef} className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
        
        {/* HEADER */}
        <header className="animate-in mb-16 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-500 mb-2">
              Parsing system // v1
            </p>
            <h1 className="text-5xl font-bold tracking-tighter">
              BFHL <span className="text-[#ff4d4d]">Hierarchy</span>
            </h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-neutral-500 uppercase">Built by Kaustubh</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* LEFT: INPUT */}
          <div className="lg:col-span-5 space-y-6 animate-in">
            <div className="text-xs text-neutral-500 mb-2">
  format: {"{ data: [\"A->B\", \"B->C\"] }"}
</div>
            <div className="bg-[#1c2128] border border-white/10 rounded-sm p-6 shadow-2xl relative">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                <Terminal size={12} /> Mode // Build
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-48 bg-transparent border-l border-white/10 pl-4 outline-none font-mono text-sm leading-relaxed text-[#c9d1d9] focus:border-[#ff4d4d] transition-colors"
              />

              <button
                onClick={submit}
                disabled={loading}
                className="w-full mt-6 bg-[#ff4d4d] hover:bg-[#ff6666] text-white font-bold py-4 px-6 uppercase tracking-widest text-xs transition-all disabled:opacity-50"
              >
                {loading ? "Constructing..." : "Execute Analysis"}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-4 text-red-500 text-xs font-mono flex items-center gap-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>

          {/* RIGHT: OUTPUT */}
          <div className="lg:col-span-7 animate-in">
            {res ? (
              <div className="space-y-4">
                {/* SWITCHER */}
                <div className="flex bg-[#1c2128] border border-white/10 p-1 rounded-sm">
                  <Tab active={view === "tree"} onClick={() => setView("tree")} icon={<TreeDeciduous size={14}/>} label="Tree" />
                  <Tab active={view === "stats"} onClick={() => setView("stats")} icon={<Info size={14}/>} label="Stats" />
                  <Tab active={view === "json"} onClick={() => setView("json")} icon={<Database size={14}/>} label="Raw" />
                </div>

                {/* CONTENT AREA */}
                <div className="bg-[#1c2128] border border-white/10 min-h-[350px] p-8 res-content">
                  {view === "tree" && (
                    <div className="space-y-10">
                      {res.hierarchies.map((h: any, i: number) => (
                        <div key={i}>
                          <div className="text-[10px] font-mono text-[#ff4d4d] uppercase mb-4 tracking-widest">
                            Structure: {h.root}
                          </div>
                          {h.has_cycle ? (
                            <p className="text-neutral-500 italic text-sm border-l border-neutral-800 pl-4">Circular loop detected.</p>
                          ) : (
                            <TreeView tree={h.tree} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {view === "stats" && (
                    <div className="grid grid-cols-2 gap-8 font-mono">
                      <StatItem label="Total Trees" value={res.summary.total_trees} />
                      <StatItem label="Active Cycles" value={res.summary.total_cycles} />
                      <StatItem label="Max Depth Root" value={res.summary.largest_tree_root || "N/A"} />
                      <div className="col-span-2 pt-4 border-t border-white/5">
                        <p className="text-[10px] text-neutral-500 mb-2 uppercase">Invalid Entries</p>
                        <p className="text-xs">{res.invalid_entries.join(", ") || "None"}</p>
                      </div>
                    </div>
                  )}

                  {view === "json" && (
                    <pre className="text-xs text-neutral-400 font-mono overflow-auto max-h-[400px]">
                      {JSON.stringify(res, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-sm py-20 text-neutral-600">
                <Database size={40} className="mb-4 opacity-20" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Awaiting Instruction</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* -------- SMALL HELPERS -------- */

function Tab({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${
        active ? 'bg-[#ff4d4d] text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function StatItem({ label, value }: any) {
  return (
    <div className="border-l border-white/5 pl-4">
      <p className="text-[10px] text-neutral-500 uppercase mb-1 tracking-tighter">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tighter">{value}</p>
    </div>
  );
}

function TreeView({ tree }: { tree: any }) {
  return (
    <div className="font-mono text-sm">
      {Object.entries(tree).map(([key, val]) => (
        <Node key={key} name={key} children={val} />
      ))}
    </div>
  );
}

function Node({ name, children }: { name: string; children: any }) {
  const hasChildren = Object.keys(children).length > 0;
  return (
    <div className="ml-4 border-l border-white/10">
      <div className="flex items-center gap-2 group py-1 -ml-1">
        <ChevronRight size={14} className={hasChildren ? "text-[#ff4d4d]" : "text-neutral-700"} />
        <span className={hasChildren ? "text-white font-semibold" : "text-neutral-400"}>
          {name}
        </span>
      </div>
      {hasChildren && (
        <div className="ml-2">
          {Object.entries(children).map(([k, v]) => (
            <Node key={k} name={k} children={v} />
          ))}
        </div>
      )}
    </div>
  );
}