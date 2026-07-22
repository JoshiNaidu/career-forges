export type TemplateId =
  | "classic"
  | "modern"
  | "compact"
  | "minimal"
  | "professional"
  | "corporate";

export interface ResumeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  accentColor: string;
  fontFamily: string;
  fontSize: "sm" | "md" | "lg";
  spacing: "tight" | "normal" | "relaxed";
  sectionOrder: string[];
  features: string[];
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column layout. Clean, timeless, and ATS-friendly.",
    accentColor: "#1a1a1a",
    fontFamily: "'Georgia', serif",
    fontSize: "md",
    spacing: "normal",
    sectionOrder: ["summary", "experience", "education", "skills"],
    features: ["Single column", "Serif typography", "Traditional headers"],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with a bold sidebar for skills and contact info.",
    accentColor: "#2563eb",
    fontFamily: "'Inter', sans-serif",
    fontSize: "md",
    spacing: "normal",
    sectionOrder: ["summary", "experience", "skills", "education"],
    features: ["Two column", "Bold sidebar", "Color accents"],
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense layout that fits more content per page. Ideal for experienced candidates.",
    accentColor: "#475569",
    fontFamily: "'Inter', sans-serif",
    fontSize: "sm",
    spacing: "tight",
    sectionOrder: ["summary", "experience", "education", "skills"],
    features: ["Dense layout", "Small font", "Maximizes space"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with generous whitespace. Focus on content over decoration.",
    accentColor: "#000000",
    fontFamily: "'Inter', sans-serif",
    fontSize: "md",
    spacing: "relaxed",
    sectionOrder: ["summary", "experience", "education", "skills"],
    features: ["Max whitespace", "No borders", "Typography-focused"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Polished corporate look with section dividers and structured headers.",
    accentColor: "#0f766e",
    fontFamily: "'Inter', sans-serif",
    fontSize: "md",
    spacing: "normal",
    sectionOrder: ["summary", "experience", "education", "skills"],
    features: ["Section dividers", "Structured headers", "Balanced layout"],
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Executive-style template with prominent headers and formal spacing.",
    accentColor: "#1e3a5f",
    fontFamily: "'Georgia', serif",
    fontSize: "lg",
    spacing: "relaxed",
    sectionOrder: ["summary", "experience", "education", "skills"],
    features: ["Executive style", "Formal spacing", "Large headers"],
  },
];

export function getTemplateById(id: TemplateId): ResumeTemplate {
  return RESUME_TEMPLATES.find((t) => t.id === id) ?? RESUME_TEMPLATES[0];
}
