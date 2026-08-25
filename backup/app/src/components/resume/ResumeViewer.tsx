import { invoke } from "@tauri-apps/api/core";
import { FileText, Download, Trash2, ExternalLink } from "lucide-react";
import type { Resume } from "@/lib/db/models";
import { useDialog } from "@/components/ui/dialog";

interface ResumeViewerProps {
  resume: Resume;
  onDelete?: (id: string) => void;
}

export default function ResumeViewer({ resume, onDelete }: ResumeViewerProps) {
  const dialog = useDialog();

  const handleView = async () => {
    try {
      // For local files, we use the system opener.
      // If the user insisted on Google/Microsoft viewers, those would only work if the file was hosted.
      // Since this is a local app, we'll open with the default system app.
      await invoke("view_resume", { path: resume.file_path });
    } catch (err) {
      console.error("Failed to view resume", err);
    }
  };

  const handleDelete = async () => {
    const confirmed = await dialog.confirmation({
      title: "Delete resume?",
      description: `${resume.filename} will be permanently removed from CareerForges.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        await invoke("delete_resume", { id: resume.id });
      },
    });

    if (confirmed) {
      onDelete?.(resume.id);
    }
  };

  const handleDownload = async () => {
     // In a local app, the file is already on the machine. 
     // We can open the folder where it's stored.
     try {
       const folderPath = resume.file_path.split(/[/\\]/).slice(0, -1).join("/");
       await invoke("view_resume", { path: folderPath });
     } catch (err) {
       console.error("Failed to open folder", err);
     }
  };

  const openInOnlineViewer = () => {
    const isPdf = resume.filename.toLowerCase().endsWith(".pdf");
    // Note: These viewers require the file to be publicly accessible.
    // For local development, this is a placeholder for the requested URLs.
    const viewerUrl = isPdf 
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(resume.file_path)}&embedded=true`
      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resume.file_path)}`;
    
    window.open(viewerUrl, '_blank');
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-medium">{resume.filename}</h3>
            <p className="text-xs text-[var(--muted)]">
              Added on {new Date(resume.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={openInOnlineViewer}
            className="p-2 text-[var(--muted)] hover:text-orange-400 transition"
            title="Open in Online Viewer (requires public URL)"
          >
            <ExternalLink size={18} />
          </button>
          <button 
            onClick={handleView}
            className="p-2 text-[var(--muted)] hover:text-white transition"
            title="View Locally"
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 text-[var(--muted)] hover:text-white transition"
            title="Open Folder"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-[var(--muted)] hover:text-red-400 transition"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {resume.ats_score !== undefined && resume.ats_score !== null && (
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ATS Score</span>
            <span className="text-sm font-bold text-orange-500">{resume.ats_score}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-1000" 
              style={{ width: `${resume.ats_score}%` }}
            />
          </div>
          
          {resume.ats_strengths && (
             <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Strengths</p>
                <p className="text-xs text-[var(--muted)] line-clamp-2">{resume.ats_strengths}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
