import { RESUME_TEMPLATES, type TemplateId, type ResumeTemplate } from "@/lib/resume-templates";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

export default function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {RESUME_TEMPLATES.map((tpl: ResumeTemplate) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl.id)}
          className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
            selected === tpl.id
              ? "border-orange-500/50 bg-orange-500/[0.06] ring-1 ring-orange-500/20"
              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
          }`}
        >
          {selected === tpl.id && (
            <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
              <Check className="h-3.5 w-3.5" />
            </div>
          )}

          {/* Mini preview thumbnail */}
          <div className="mb-4 overflow-hidden rounded-lg bg-white p-2" style={{ aspectRatio: "3 / 4" }}>
            <TemplateThumbnail template={tpl} />
          </div>

          <h3 className="font-bold text-sm">{tpl.name}</h3>
          <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed line-clamp-2">{tpl.description}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tpl.features.map((f) => (
              <span
                key={f}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  selected === tpl.id ? "bg-orange-500/15 text-orange-400" : "bg-white/5 text-[var(--muted)]"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function TemplateThumbnail({ template }: { template: ResumeTemplate }) {
  const isTwoCol = template.id === "modern";
  const isCompact = template.id === "compact";
  const isMinimal = template.id === "minimal";

  const lineH = isCompact ? "h-1" : "h-1.5";
  const gapY = isCompact ? "gap-0.5" : isMinimal ? "gap-2" : "gap-1";

  return (
    <div className="h-full w-full" style={{ fontFamily: template.fontFamily }}>
      {isTwoCol ? (
        <div className="flex h-full gap-1.5">
          <div className="flex w-1/3 flex-col gap-1">
            <div className="h-1.5 rounded" style={{ backgroundColor: template.accentColor }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${lineH} rounded bg-gray-300`} />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <div className="h-2 rounded bg-gray-800" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${lineH} rounded bg-gray-200`} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex h-full flex-col ${gapY}`}>
          <div className="h-2.5 rounded" style={{ backgroundColor: template.accentColor }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`${lineH} rounded bg-gray-200`}
              style={{ width: `${90 - (i % 3) * 15}%` }}
            />
          ))}
          <div className={`mt-1 h-1.5 rounded bg-gray-400`} style={{ width: "60%" }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${lineH} rounded bg-gray-200`} style={{ width: `${85 - (i % 2) * 10}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
