import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/db/service";
import { invoke } from "@tauri-apps/api/core";
import type { Resume, GeneratedResume, GeneratedCoverLetter, Job } from "@/lib/db/models";
import ResumeViewer from "@/components/resume/ResumeViewer";
import { useDialog } from "@/components/ui/dialog";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  User,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  Code,
  History,
  Trash2,
  Download,
  Eye,
  Mail,
  ChevronRight,
  Plus,
  Upload
} from "lucide-react";

export default function ATSPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "profile" | "history">("analysis");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialog = useDialog();

  const [result, setResult] = useState<{
    score: number;
    feedback: string[];
    missingKeywords: string[];
  } | null>(null);

  const [generatedResumes, setGeneratedResumes] = useState<(GeneratedResume & { job?: Job })[]>([]);
  const [generatedCVs, setGeneratedCVs] = useState<(GeneratedCoverLetter & { job?: Job })[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ type: 'resume' | 'cv', data: any } | null>(null);

  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  
  const parsedProfile = useMemo(() => {
    if (!selectedResume?.master_resume_json) return null;
    try {
      const master = JSON.parse(selectedResume.master_resume_json);
      return master.profile;
    } catch (e) {
      console.error("Failed to parse master_resume_json", e);
      return null;
    }
  }, [selectedResume]);

  const loadData = async () => {
    const users = await db.listUsers();
    if (users.length > 0) {
      const userId = users[0].id;
      
      // Load Master Resumes
      const userResumes = await db.listUserResumes(userId);
      setResumes(userResumes);
      if (userResumes.length > 0) {
        if (!selectedResumeId) {
          const defaultResume = userResumes.find(r => r.is_default);
          setSelectedResumeId(defaultResume?.id || userResumes[0].id);
        }
      }

      // Load History
      const [genResumes, genCVs, allJobs] = await Promise.all([
        db.listAllGeneratedResumes(userId),
        db.listAllGeneratedCoverLetters(userId),
        db.listAllJobs()
      ]);

      setGeneratedResumes(genResumes.map(r => ({
        ...r,
        job: allJobs.find(j => j.id === r.job_id)
      })));

      setGeneratedCVs(genCVs.map(cv => ({
        ...cv,
        job: allJobs.find(j => j.id === cv.job_id)
      })));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = Array.from(new Uint8Array(arrayBuffer));

      const result = await invoke<Resume>("parse_and_store_resume", {
        fileName: file.name,
        fileBytes: bytes,
      });

      await loadData();
      setSelectedResumeId(result.id);
      setActiveTab("profile");
    } catch (err) {
      console.error("[ATS] Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSetMaster = async (resumeId: string) => {
    try {
      const users = await db.listUsers();
      if (users.length > 0) {
        await invoke("db_set_default_resume", {
          id: resumeId,
          userId: users[0].id
        });
        await loadData();
      }
    } catch (err) {
      console.error("[ATS] Set master failed", err);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResume || !jobDescription) return;
    
    setAnalyzing(true);
    // Simulate AI analysis for now
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResult({
      score: 72,
      feedback: [
        "Your experience with React is well-highlighted.",
        "Consider adding more metrics to your achievements.",
        "Ensure your contact information is at the very top."
      ],
      missingKeywords: ["Docker", "Kubernetes", "GraphQL", "Agile Methodology"]
    });
    setAnalyzing(false);
  };

  const handleDeleteGenerated = async (id: string, type: 'resume' | 'cv') => {
    const confirmed = await dialog.confirmation({
      title: "Delete generated version?",
      description: "This generated document version will be permanently removed.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (type === 'resume') {
          await db.deleteGeneratedResume(id);
        } else {
          await db.deleteGeneratedCoverLetter(id);
        }
        await loadData();
      },
    });

    if (!confirmed) return;

    if (previewDoc?.data.id === id) setPreviewDoc(null);
  };

  const handleDownload = (doc: any, type: 'resume' | 'cv') => {
    const content = type === 'resume' 
      ? JSON.stringify(doc, null, 2)
      : doc.content;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'resume' ? 'ATS_Resume' : 'Cover_Letter'}_${doc.job?.company || 'Job'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">ATS Optimizer</h1>
          <p className="mt-2 text-[var(--muted)]">Analyze and generate job-specific resume versions and cover letters.</p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
          {(["analysis", "profile", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab 
                  ? "bg-white text-black shadow-lg" 
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* History List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-orange-400" />
                History
              </h2>
              
              <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
                {/* Resumes */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Optimized Resumes</h3>
                  {generatedResumes.length > 0 ? (
                    generatedResumes.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setPreviewDoc({ type: 'resume', data: doc })}
                        className={`group cursor-pointer rounded-2xl border p-4 transition ${
                          previewDoc?.data.id === doc.id 
                            ? "border-orange-500/50 bg-orange-500/[0.05]" 
                            : "border-white/5 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold truncate max-w-[150px]">{doc.job?.title || "Unknown Job"}</p>
                            <p className="text-[10px] text-orange-400/80 mt-0.5">{doc.job?.company || "Unknown Company"}</p>
                          </div>
                          <FileText size={14} className="text-[var(--muted)]" />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] text-[var(--muted)]">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteGenerated(doc.id, 'resume'); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--muted)] italic">No generated resumes yet.</p>
                  )}
                </div>

                {/* Cover Letters */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Cover Letters</h3>
                  {generatedCVs.length > 0 ? (
                    generatedCVs.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setPreviewDoc({ type: 'cv', data: doc })}
                        className={`group cursor-pointer rounded-2xl border p-4 transition ${
                          previewDoc?.data.id === doc.id 
                            ? "border-orange-500/50 bg-orange-500/[0.05]" 
                            : "border-white/5 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold truncate max-w-[150px]">{doc.job?.title || "Unknown Job"}</p>
                            <p className="text-[10px] text-orange-400/80 mt-0.5">{doc.job?.company || "Unknown Company"}</p>
                          </div>
                          <Mail size={14} className="text-[var(--muted)]" />
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] text-[var(--muted)]">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteGenerated(doc.id, 'cv'); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--muted)] italic">No cover letters yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            {previewDoc ? (
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      {previewDoc.type === 'resume' ? <FileText className="text-orange-400" /> : <Mail className="text-orange-400" />}
                      {previewDoc.type === 'resume' ? 'Optimized Resume' : 'Cover Letter'}
                    </h2>
                    <p className="text-[var(--muted)] mt-1">
                      For <span className="text-white font-medium">{previewDoc.data.job?.title}</span> at <span className="text-orange-400">{previewDoc.data.job?.company}</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDownload(previewDoc.data, previewDoc.type)}
                      className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl p-8 font-serif text-white/90 leading-relaxed shadow-inner max-h-[600px] overflow-y-auto whitespace-pre-wrap">
                  {previewDoc.type === 'resume' ? (
                    <div className="space-y-8 font-sans">
                      <div>
                        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Professional Summary</h3>
                        <p className="text-sm leading-relaxed">{previewDoc.data.optimized_summary}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Key Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {previewDoc.data.optimized_skills?.split(',').map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-xs">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Optimized Achievements</h3>
                        <ul className="space-y-3">
                          {(() => {
                            try {
                              const bullets = JSON.parse(previewDoc.data.optimized_experience || "[]");
                              return bullets.map((b: string, i: number) => (
                                <li key={i} className="text-sm flex gap-3">
                                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                                  {b}
                                </li>
                              ));
                            } catch (e) {
                              return <p className="text-xs text-red-400">Failed to load experience bullets.</p>;
                            }
                          })()}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{previewDoc.data.content}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-[600px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 p-12 text-center opacity-50">
                <Eye className="h-12 w-12 text-white/20" />
                <h3 className="mt-4 text-lg font-medium">Document Preview</h3>
                <p className="mt-2 text-sm text-[var(--muted)] max-w-xs">
                  Select a generated resume or cover letter from the history to preview it here.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--muted)]">Select Resume</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
                >
                  {uploading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload New
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="flex flex-col gap-2">
                <select 
                  className="w-full rounded-xl border border-white/5 bg-[var(--surface)] p-3 outline-none focus:border-orange-500/50"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.filename} {r.is_default ? '(Master Piece)' : ''}</option>
                  ))}
                </select>
                
                {selectedResume && !selectedResume.is_default && (
                  <button 
                    onClick={() => handleSetMaster(selectedResume.id)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500/20 transition"
                  >
                    <CheckCircle2 size={14} />
                    Set as Master Piece
                  </button>
                )}
              </div>

              {selectedResume && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--muted)]">Selected Resume Details</label>
                    {selectedResume.is_default && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest ring-1 ring-green-400/20">
                        <Zap size={10} /> Master Piece
                      </span>
                    )}
                  </div>
                  <ResumeViewer resume={selectedResume} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--muted)]">Job Description</label>
                <textarea 
                  className="w-full h-64 rounded-xl border border-white/5 bg-[var(--surface)] p-4 outline-none focus:border-orange-500/50 resize-none"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={analyzing || !jobDescription || !selectedResume}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Run Local Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-white/5 pb-1">
              <button 
                onClick={() => setActiveTab("analysis")}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === "analysis" ? "text-orange-500" : "text-[var(--muted)] hover:text-white"
                }`}
              >
                ATS Analysis
                {activeTab === "analysis" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </button>
              <button 
                onClick={() => setActiveTab("profile")}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === "profile" ? "text-orange-500" : "text-[var(--muted)] hover:text-white"
                }`}
              >
                Master Piece (Profile)
                {activeTab === "profile" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </button>
            </div>

            {activeTab === "analysis" ? (
              result ? (
                <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Analysis Result</h2>
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <svg className="h-20 w-20 -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 36}
                          strokeDashoffset={2 * Math.PI * 36 * (1 - result.score / 100)}
                          className="text-orange-500"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">{result.score}%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      AI Feedback
                    </h3>
                    <ul className="space-y-2">
                      {result.feedback.map((f, i) => (
                        <li key={i} className="text-sm text-[var(--muted)] flex gap-3">
                          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-5 w-5 text-orange-400" />
                      Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((k, i) => (
                        <span key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium border border-white/5">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10">
                    Optimize Resume Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 p-12 text-center opacity-50">
                  <Search className="h-12 w-12 text-white/20" />
                  <h3 className="mt-4 text-lg font-medium">Ready for Analysis</h3>
                  <p className="mt-2 text-sm text-[var(--muted)] max-w-xs">
                    Select your resume and paste a job description to see how you rank.
                  </p>
                </div>
              )
            ) : (
              /* Master Piece / Profile View */
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto max-h-[700px]">
                {parsedProfile ? (
                  <>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        <User className="h-6 w-6 text-orange-400" />
                        {parsedProfile.name || "Unnamed Profile"}
                      </h2>
                      <p className="text-sm text-[var(--muted)] leading-relaxed">
                        {parsedProfile.summary}
                      </p>
                    </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Code className="h-5 w-5 text-orange-400" />
                      Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedProfile.skills?.map((skill: string, i: number) => (
                        <span key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs border border-white/5">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BriefcaseIcon className="h-5 w-5 text-orange-400" />
                      Work Experience
                    </h3>
                    <div className="space-y-6">
                      {parsedProfile.experience?.map((exp: any, i: number) => (
                        <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-[1px] before:bg-white/10">
                          <div className="absolute left-[-4px] top-2 h-2 w-2 rounded-full bg-orange-500" />
                          <h4 className="font-medium">{exp.title}</h4>
                          <p className="text-sm text-orange-400/80">{exp.company} • {exp.duration}</p>
                          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                            {exp.description}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {exp.bullets?.map((bullet: string, j: number) => (
                              <li key={j} className="text-xs text-[var(--muted)] flex gap-2">
                                <span className="text-orange-500">•</span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-orange-400" />
                      Education
                    </h3>
                    <div className="space-y-4">
                      {parsedProfile.education?.map((edu: any, i: number) => (
                        <div key={i}>
                          <h4 className="font-medium">{edu.degree}</h4>
                          <p className="text-sm text-[var(--muted)]">{edu.institution} • {edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-[400px] flex-col items-center justify-center text-center opacity-50">
                  <FileText className="h-12 w-12 text-white/20" />
                  <h3 className="mt-4 text-lg font-medium">No Profile Data</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    This resume hasn't been parsed into a Master Piece yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);
}
