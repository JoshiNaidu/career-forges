import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  messages: Message[];
  liveMode?: boolean;
};

export default function TranscriptPanel({
  messages,
  liveMode = false,
}: Props) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">

      <div
        className={`space-y-${
          liveMode ? "3" : "4"
        }`}
      >

        {messages.length ===
          0 && (
          <div className="flex min-h-[220px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10">

                <div className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse" />

              </div>

              <h3 className="text-base font-semibold text-[var(--text)]">
                AI Interview Ready
              </h3>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Start the interview to begin the session.
              </p>

            </div>

          </div>
        )}

        {messages.map(
          (message) => (
            <motion.div
              key={message.id}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className={`flex ${
                message.role ===
                "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                  message.role ===
                  "assistant"
                    ? "border-orange-500/10 bg-orange-500/[0.06]"
                    : "border-[var(--border)] bg-[var(--surface-2)]"
                }`}
              >

                <div className="flex items-center gap-2 mb-2">

                  <div
                    className={`h-2 w-2 rounded-full ${
                      message.role ===
                      "assistant"
                        ? "bg-orange-400"
                        : "bg-blue-400"
                    }`}
                  />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">

                    {message.role ===
                    "assistant"
                      ? "AI Interviewer"
                      : "You"}

                  </p>

                  {liveMode &&
                    message.role ===
                      "assistant" && (
                      <div className="ml-1 flex items-center gap-1">

                        <div className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />

                        <p className="text-[10px] uppercase tracking-[0.12em] text-orange-400">
                          Live
                        </p>

                      </div>
                    )}

                </div>

                <div className="prose prose-invert prose-sm max-w-none text-[var(--text)] leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>

              </div>

            </motion.div>
          )
        )}

      </div>

    </div>
  );
}