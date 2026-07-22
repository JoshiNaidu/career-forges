import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";

export default function WelcomePage() {
  const navigate = useNavigate();
  const handleLearnMore = async () => {
    try {
      await openUrl("https://careerforges.app");
    } catch (error) {
      console.error("Failed to open Learn More URL:", error);
    }
  };

  return (
    <AnimatePresence mode="wait">
        <motion.section
          key="welcome-content"
          className="flex min-h-screen items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <div className="max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-400">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              Local AI Career Assistant
            </div>

            <h1 className="text-6xl font-bold leading-tight tracking-tight">
              Forge Your Career
              <br />
              With Local AI
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              CareerForges helps you build ATS-friendly resumes,
              analyze jobs, prepare for interviews,
              and manage applications privately on your machine.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={async () => {
                  try {
                    await invoke(
                      "db_set_onboarding_step",
                      {
                        step: "resume_upload",
                      },
                    );

                    navigate("/upload-resume");
                  } catch (err) {
                    console.error(
                      "Failed to start onboarding",
                      err,
                    );
                  }
                }}
                className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-4 font-medium text-white transition hover:scale-[1.02]"
              >
                Get Started
                <ArrowRight size={18} />
              </button>

              <button className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm transition hover:bg-white/[0.06]" onClick={handleLearnMore}>
                Learn More
              </button>
            </div>
          </div>
        </motion.section>
    </AnimatePresence>
  );
}
