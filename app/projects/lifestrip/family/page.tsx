'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaCamera,
  FaTimes,
} from 'react-icons/fa';

interface FamilyMember {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lifestrip_family');
    if (saved) {
      setMembers(JSON.parse(saved));
    }
  }, []);

  const saveMembers = (updated: FamilyMember[]) => {
    setMembers(updated);
    localStorage.setItem('lifestrip_family', JSON.stringify(updated));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addMember = async () => {
    if (!newName || (!newDesc && !uploadedImage)) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/lifestrip/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          image: uploadedImage, // Base64 string
        }),
      });

      if (!res.ok) {
        throw new Error('角色生成失敗');
      }

      const data = await res.json();

      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: newName,
        description: newDesc,
        avatarUrl: data.avatarUrl,
      };

      saveMembers([...members, newMember]);
      setNewName('');
      setNewDesc('');
      setUploadedImage(null);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeMember = (id: string) => {
    saveMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FBF9F1] text-slate-700 p-8 font-sans selection:bg-[#AAD7D9]">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-6 border-b-2 border-[#E5E1DA] pb-12">
          <Link
            href="/projects/lifestrip"
            className="flex items-center text-[#92C7CF] hover:text-[#AAD7D9] transition-all font-bold uppercase text-[10px] tracking-widest group"
          >
            <div className="w-8 h-8 rounded-full border border-[#E5E1DA] flex items-center justify-center mr-3 group-hover:bg-[#FBF9F1] transition-colors">
              <FaArrowLeft />
            </div>
            Back to Dashboard
          </Link>
          <h1 className="text-5xl font-black tracking-tighter text-slate-800">
            Family<span className="text-[#92C7CF] italic">Archive</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {members.map((member) => (
            <div
              key={member.id}
              className="relative bg-white border-2 border-[#E5E1DA] rounded-[2.5rem] shadow-xl shadow-[#E5E1DA]/20 hover:shadow-2xl hover:shadow-[#AAD7D9]/30 hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
            >
              <div className="aspect-square bg-[#FBF9F1] relative">
                {member.avatarUrl && (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => removeMember(member.id)}
                  className="absolute top-4 right-4 p-4 bg-white/90 backdrop-blur-md border border-[#E5E1DA] text-slate-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 hover:text-white"
                >
                  <FaTrash size={14} />
                </button>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 bg-[#92C7CF] rounded-full" />
                  <h3 className="text-2xl font-black tracking-tighter text-slate-800">
                    {member.name}
                  </h3>
                </div>
                <p className="text-slate-400 text-[11px] font-bold leading-relaxed line-clamp-3 uppercase tracking-wider">
                  {member.description}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center aspect-square bg-white border-2 border-dashed border-[#E5E1DA] rounded-[2.5rem] hover:border-[#92C7CF] hover:bg-[#AAD7D9]/5 transition-all duration-500 group shadow-sm hover:shadow-2xl hover:shadow-[#AAD7D9]/20"
          >
            <div className="w-16 h-16 bg-[#FBF9F1] rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 group-hover:bg-[#AAD7D9]/10 border border-[#E5E1DA]">
              <FaPlus className="text-xl text-[#92C7CF]" />
            </div>
            <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Add Character
            </span>
          </button>
        </div>

        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/5 backdrop-blur-xl flex items-center justify-center p-6 z-50">
            <div className="bg-white border-2 border-[#E5E1DA] rounded-[3rem] p-12 max-w-lg w-full shadow-2xl relative">
              <div className="absolute -top-4 -left-4 bg-[#92C7CF] text-white font-black px-6 py-2 rounded-2xl text-xs tracking-widest italic shadow-lg shadow-[#AAD7D9]/50">
                Persona Setup
              </div>

              <div className="mt-8 space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.25em]">
                    Name / Identifier
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#FBF9F1] border-none rounded-2xl p-5 focus:outline-none focus:bg-[#AAD7D9]/10 text-slate-700 font-bold placeholder-slate-200 transition-colors"
                    placeholder="e.g. Me, Kiki, Dad"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.25em]">
                    Visual DNA (Description)
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#FBF9F1] border-none rounded-3xl p-6 h-32 focus:outline-none focus:bg-[#AAD7D9]/10 text-slate-700 font-bold placeholder-slate-200 resize-none transition-colors"
                    placeholder="Short messy hair, wearing a oversized hoodie..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-[0.25em]">
                    Reference Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  {uploadedImage ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-[#AAD7D9]">
                      <img
                        src={uploadedImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 p-2 bg-white/90 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-all shadow-lg"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 bg-[#FBF9F1] border-2 border-dashed border-[#E5E1DA] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#92C7CF] hover:bg-[#AAD7D9]/5 transition-all group"
                    >
                      <FaCamera className="text-[#92C7CF] group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Upload Photo
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setUploadedImage(null);
                  }}
                  className="flex-1 px-4 py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:bg-[#FBF9F1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMember}
                  disabled={
                    isGenerating || !newName || (!newDesc && !uploadedImage)
                  }
                  className="flex-1 px-4 py-5 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#92C7CF] hover:shadow-xl hover:shadow-[#AAD7D9]/50 transition-all disabled:opacity-30"
                >
                  {isGenerating ? 'Processing...' : 'Register Persona'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
