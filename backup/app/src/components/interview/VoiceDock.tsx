import {
  Mic,
  MicOff,
  Send,
} from "lucide-react";

type Props = {
  listening: boolean;
  input: string;

  setInput: (
    value: string
  ) => void;

  onSend: () => void;

  toggleListening: () => void;
};

export default function VoiceDock({
  listening,
  input,
  setInput,
  onSend,
  toggleListening,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-2">

      {/* MIC */}
      <button
        onClick={
          toggleListening
        }
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          listening
            ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            : "bg-[var(--surface-2)] text-[var(--muted)]"
        }`}
      >

        {listening ? (
          <Mic size={18} />
        ) : (
          <MicOff size={18} />
        )}

      </button>

      {/* INPUT */}
      <div className="relative flex-1">

        <input
          value={input}
          onChange={(
            event
          ) =>
            setInput(
              event.target
                .value
            )
          }
          placeholder="Respond to the interviewer..."
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />

      </div>

      {/* SEND */}
      <button
        onClick={onSend}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.28)] transition hover:scale-[1.02]"
      >

        <Send size={17} />

      </button>

    </div>
  );
}