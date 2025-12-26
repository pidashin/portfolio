'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBookOpen, FaMagic, FaUsers, FaHistory } from 'react-icons/fa';

interface FamilyMember {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
}

export default function LifeStripPage() {
  const [diary, setDiary] = useState('');
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [panels, setPanels] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lifestrip_family');
    if (saved) {
      setFamily(JSON.parse(saved));
    }
  }, []);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleGenerate = async () => {
    if (!diary) return;
    setIsGenerating(true);
    setPanels([]); // Reset panels

    try {
      const selectedMemberDetails = family.filter((m) =>
        selectedMembers.includes(m.id),
      );

      const res = await fetch('/api/lifestrip/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diaryText: diary,
          members: selectedMemberDetails,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '漫畫生成失敗');
      }

      const data = await res.json();
      setPanels(data.panels || []);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F1] text-slate-700 font-sans selection:bg-[#AAD7D9]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b-2 border-[#E5E1DA] pb-10">
          <div>
            <div className="flex items-center gap-2 text-[#92C7CF] mb-3 font-bold">
              <FaBookOpen />
              <span className="text-xs uppercase tracking-[0.2em] font-black">
                Digital Serialization
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none text-slate-800">
              Life<span className="text-[#92C7CF] italic">Strip</span>
            </h1>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/projects/lifestrip/family"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5E1DA] rounded-2xl text-slate-500 hover:text-[#92C7CF] hover:border-[#AAD7D9] hover:bg-[#FBF9F1] transition-all font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              <FaUsers className="text-[#AAD7D9]" />
              <span>Family Archive</span>
            </Link>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5E1DA] rounded-2xl text-slate-500 hover:text-[#92C7CF] hover:border-[#AAD7D9] hover:bg-[#FBF9F1] transition-all font-bold text-xs uppercase tracking-wider shadow-sm">
              <FaHistory className="text-[#AAD7D9]" />
              <span>History</span>
            </button>
          </nav>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Side: Input */}
          <section className="lg:col-span-12 xl:col-span-5 space-y-8">
            <div className="bg-white border-2 border-[#E5E1DA] rounded-[2.5rem] p-10 shadow-xl shadow-[#E5E1DA]/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#AAD7D9]/20 blur-3xl rounded-full" />

              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#92C7CF] rounded-full shadow-[0_0_10px_rgba(146,199,207,0.5)]" />
                Journal Entry (繁體中文)
              </h2>

              <textarea
                value={diary}
                onChange={(e) => setDiary(e.target.value)}
                placeholder="分享今天的故事..."
                className="w-full h-72 bg-transparent border-none focus:ring-0 text-2xl font-medium leading-relaxed placeholder-slate-200 resize-none mb-8 italic text-slate-600"
              />

              <div className="pt-8 border-t border-[#E5E1DA] space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  Cast Members
                  <span className="h-[1px] flex-1 bg-[#E5E1DA]" />
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {family.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all duration-300 ${
                        selectedMembers.includes(member.id)
                          ? 'bg-[#92C7CF] text-white shadow-lg shadow-[#AAD7D9] -translate-y-0.5'
                          : 'bg-[#FBF9F1] text-slate-400 hover:border-[#AAD7D9] border border-transparent'
                      }`}
                    >
                      {member.name}
                    </button>
                  ))}
                  {family.length === 0 && (
                    <Link
                      href="/projects/lifestrip/family"
                      className="text-xs text-[#92C7CF] font-bold hover:underline"
                    >
                      Add family members first
                    </Link>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !diary}
                className="w-full mt-10 py-6 rounded-[2rem] bg-slate-800 font-black text-lg tracking-tight hover:bg-[#92C7CF] hover:shadow-2xl hover:shadow-[#AAD7D9]/50 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-30 text-white uppercase"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="tracking-widest text-sm text-white/80">
                      Inking Diary...
                    </span>
                  </>
                ) : (
                  <>
                    <FaMagic size={18} className="text-[#AAD7D9]" />
                    <span className="tracking-widest">Draw My Day</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-slate-300 font-bold text-[9px] text-center px-4 leading-relaxed uppercase tracking-[0.25em]">
              Powered by <span className="text-[#92C7CF]">Nano Banana</span> •
              Character Identity Synchronization
            </p>
          </section>

          {/* Right Side: Comic Layout */}
          <section className="lg:col-span-12 xl:col-span-7">
            {panels.length > 0 ? (
              <div className="grid grid-cols-2 gap-8 p-10 bg-white border-2 border-[#E5E1DA] rounded-[3rem] shadow-2xl shadow-[#E5E1DA]/10">
                {panels.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-[#FBF9F1] rounded-[2rem] overflow-hidden relative group hover:scale-[1.03] transition-all duration-500 border-2 border-[#E5E1DA]"
                  >
                    <img
                      src={url}
                      alt={`Panel ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-xl text-slate-700 text-[10px] font-black px-3 py-1.5 shadow-sm border border-[#E5E1DA] italic">
                      STEP {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[4/5] bg-white border-2 border-[#E5E1DA] rounded-[3rem] shadow-inner flex flex-col items-center justify-center text-slate-200 p-12 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#AAD7D9]/10 to-[#FBF9F1] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-24 h-24 bg-[#FBF9F1] rounded-[2.5rem] mb-8 flex items-center justify-center text-5xl grayscale opacity-30 transition-all group-hover:grayscale-0 group-hover:opacity-100 group-hover:rotate-12 group-hover:scale-110 border border-[#E5E1DA]">
                  🪄
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter text-slate-800">
                  New Storyline
                </h3>
                <p className="text-[11px] max-w-sm uppercase tracking-[0.2em] text-slate-400 font-bold leading-relaxed">
                  Your comic is currently blank. Pen your thoughts to generate
                  the 4-panel series.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
