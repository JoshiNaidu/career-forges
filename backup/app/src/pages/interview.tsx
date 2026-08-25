import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { invoke } from "@tauri-apps/api/core";

import { listen } from "@tauri-apps/api/event";

import {
  getCurrentModel,
  getCurrentProvider,
} from "../lib/ai-preferences";

import { db } from "@/lib/db/service";
import { useSearchParams } from "react-router-dom";
import type { ChatSession } from "@/lib/db/models";

import InterviewHeader from "../components/interview/InterviewHeader";

import InterviewSetupPanel from "../components/interview/InterviewSetupPanel";

import InterviewTabs from "../components/interview/InterviewTabs";

import VoiceDock from "../components/interview/VoiceDock";

type InterviewMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatReply = {
  success: boolean;
  model: string;
  response: string;
  error?: string | null;
};

const KEY =
  "cf_interview_session_v1";

const INTERVIEW_MODES = [
  {
    id: "interview_practice",
    label: "Practice Mode",
  },
  {
    id: "interview_realistic",
    label:
      "Realistic Interview Mode",
  },
  {
    id: "interview_technical",
    label:
      "Technical Interview",
  },
  {
    id: "interview_hr",
    label: "HR Interview",
  },
  {
    id:
      "interview_behavioral",
    label:
      "Behavioral Interview",
  },
  {
    id:
      "interview_rapid_fire",
    label: "Rapid Fire Round",
  },
];

const PERSONALITIES = [
  "Friendly Recruiter",
  "Strict FAANG Interviewer",
  "Startup Founder",
  "Technical Architect",
  "HR Manager",
];


interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  onresult:
  | ((
    event: SpeechRecognitionEvent
  ) => void)
  | null;

  onend:
  | (() => void)
  | null;

  onerror:
  | (() => void)
  | null;

  start: () => void;

  stop: () => void;
};

type SpeechRecognitionCtor =
  new () => SpeechRecognitionInstance;


function loadMessages(): InterviewMessage[] {
  try {
    const raw =
      sessionStorage.getItem(
        KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export default function InterviewPage() {
  const [messages, setMessages] =
    useState<
      InterviewMessage[]
    >(loadMessages);

  const [prompt, setPrompt] =
    useState("");

  const silenceTimeoutRef =
    useRef<number | null>(
      null
    );

  const shouldRestartRef =
    useRef(false);

  const [mode, setMode] =
    useState(
      INTERVIEW_MODES[0].id
    );

  const [
    personality,
    setPersonality,
  ] = useState(
    PERSONALITIES[0]
  );

  const [
    inputSource,
    setInputSource,
  ] = useState(
    "custom_jd"
  );

  const [
    jobContext,
    setJobContext,
  ] = useState("");

  const [
    resumeContext,
    setResumeContext,
  ] = useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [analysis, setAnalysis] =
    useState<{
      confidence: string;
      technical: string;
      communication: string;
      feedback: string;
    } | null>(null);

  const [activeTab, setActiveTab] =
    useState<"live" | "transcript" | "analysis" | "notes">("live");

  const [
    isListening,
    setIsListening,
  ] = useState(false);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [
    liveAssistantText,
    setLiveAssistantText,
  ] = useState("");


  const [elapsedSec, setElapsedSec] =
    useState(0);

  const [round, setRound] =
    useState(1);

  const [model, setModel] =
    useState("");

  const [provider, setProvider] =
    useState("");

  const [aiState, setAiState] =
    useState<
      | "idle"
      | "thinking"
      | "speaking"
      | "listening"
    >("idle");

  const activeAssistantId =
    useRef<string | null>(
      null
    );

  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<ChatSession | null>(null);

  /*
    LOAD SESSION FROM URL
  */
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId) {
      void db.getSession(sessionId).then(s => {
        if (s) {
          setSession(s);
          if (s.job_description) {
            setJobContext(s.job_description);
            setInputSource("custom_jd");
          }
        }
      });
    }
  }, [searchParams]);

  const spokenTextRef =
    useRef<string>("");

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  // Track finalized transcript for current turn
  const finalTranscriptRef = useRef<string>("");

  /*
    LOAD AI PREFS
  */
  useEffect(() => {
    let mounted = true;

    const sync =
      async () => {
        const currentModel =
          await getCurrentModel();

        const currentProvider =
          await getCurrentProvider();

        if (!mounted) {
          return;
        }

        setModel(
          currentModel
        );

        setProvider(
          currentProvider
        );
      };

    void sync();

    window.addEventListener(
      "ai-preferences-updated",
      sync
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "ai-preferences-updated",
        sync
      );
    };
  }, []);

  /*
    PERSIST
  */
  useEffect(() => {
    sessionStorage.setItem(
      KEY,
      JSON.stringify(
        messages
      )
    );
  }, [messages]);

  /*
    TIMER
  */
  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const t =
      window.setInterval(
        () => {
          setElapsedSec(
            (
              v
            ) => v + 1
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        t
      );
  }, [isLoading]);

  /*
    STREAMING
  */
  useEffect(() => {
    const unlistenPromise =
      listen<{
        chunk: string;
        mode: string;
      }>(
        "ollama-chat-chunk",
        (
          event
        ) => {
          const id =
            activeAssistantId.current;

          if (!id || !INTERVIEW_MODES.some(m => m.id === event.payload.mode)) {
            return;
          }

          const chunk =
            event.payload
              ?.chunk || "";

          setLiveAssistantText(
            (prev) =>
              prev + chunk
          );


          if (!chunk) {
            return;
          }

          setMessages(
            (
              prev
            ) => {
              const copy =
                [...prev];

              const idx =
                copy.findIndex(
                  (
                    m
                  ) =>
                    m.id ===
                    id
                );

              if (
                idx === -1
              ) {
                return prev;
              }

              const newContent = copy[idx].content + chunk;
              copy[idx] =
              {
                ...copy[
                idx
                ],
                content: newContent,
              };

              // Real-time speech: detect sentences
              const sentenceEndings = /[.!?]\s/;
              const remaining = newContent.slice(spokenTextRef.current.length);
              
              if (sentenceEndings.test(remaining)) {
                // Find the last complete sentence in the remaining part
                const lastSentenceIdx = Math.max(
                  remaining.lastIndexOf(". "),
                  remaining.lastIndexOf("? "),
                  remaining.lastIndexOf("! ")
                );

                if (lastSentenceIdx !== -1) {
                  const toSpeak = remaining.slice(0, lastSentenceIdx + 1);
                  speak(toSpeak, false);
                  spokenTextRef.current += toSpeak;
                }
              }

              return copy;
            }
          );
        }
      );

    return () => {
      void unlistenPromise.then(
        (
          u
        ) => u()
      );
    };
  }, []);

  /*
    CLEANUP SPEECH
  */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const contextIntro =
    useMemo(() => {
      return [
        `Interview mode: ${mode}`,
        `Interviewer personality: ${personality}`,
        `Input source: ${inputSource}`,
        `Job context: ${jobContext ||
        "Not provided"
        }`,
        `Resume context: ${resumeContext ||
        "Not provided"
        }`,
        "Rules: Ask only one question at a time. Wait for candidate answer.",
      ].join("\n");
    }, [
      jobContext,
      mode,
      personality,
      inputSource,
      resumeContext,
    ]);

  const speak =
    useCallback(
      (
        text: string,
        shouldCancel: boolean = true
      ) => {
        if (
          !window.speechSynthesis ||
          !text.trim()
        ) {
          return;
        }

        if (shouldCancel) {
          window.speechSynthesis.cancel();
          spokenTextRef.current = "";
        }

        const utter =
          new SpeechSynthesisUtterance(
            text
          );

        utter.rate = 1;

        utter.pitch = 1;

        utter.onstart =
          () => {
            setIsSpeaking(
              true
            );

            setAiState(
              "speaking"
            );
          };

        utter.onend =
          () => {
            setIsSpeaking(
              false
            );

            setAiState(
              "idle"
            );

            setLiveAssistantText(
              ""
            );
          };


        window.speechSynthesis.speak(
          utter
        );
      },
      []
    );

  const stopSpeechRecognition =
    useCallback((isManual: boolean = true) => {
      if (
        silenceTimeoutRef.current
      ) {
        clearTimeout(
          silenceTimeoutRef.current
        );
      }

      recognitionRef.current?.stop();

      recognitionRef.current =
        null;

      if (isManual) {
        shouldRestartRef.current = false;
      }

      setIsListening(
        false
      );

      setAiState(
        "idle"
      );

      setPrompt("");
    }, []);

  const sendTurn =
    useCallback(
      async (
        event?: FormEvent,
        forcedText?: string
      ) => {
        event?.preventDefault();

        if (!model) {
          setError(
            "No AI model selected."
          );

          return;
        }

        const outgoing =
          (
            forcedText ??
            prompt
          ).trim();

        if (
          isLoading ||
          !outgoing
        ) {
          return;
        }

        // Stop recognition if it's running (e.g. manual send)
        if (recognitionRef.current) {
          stopSpeechRecognition(false);
        }

        const userMsg: InterviewMessage =
        {
          id: `${Date.now()}-u`,
          role: "user",
          content:
            outgoing,
        };

        const assistantId =
          `${Date.now()}-a`;

        activeAssistantId.current =
          assistantId;

        setError(null);

        setIsLoading(true);

        setAiState(
          "thinking"
        );

        setElapsedSec(0);

        setPrompt("");

        setLiveAssistantText("");
        
        spokenTextRef.current = "";
        window.speechSynthesis?.cancel();

        setMessages(
          (
            prev
          ) => [
              ...prev,
              userMsg,
              {
                id: assistantId,
                role:
                  "assistant",
                content: "",
              },
            ]
        );

        const payloadMessages =
          [
            {
              role: "user",
              content:
                contextIntro,
            },
            ...messages
              .slice(-10)
              .map(
                (
                  m
                ) => ({
                  role:
                    m.role,
                  content:
                    m.content,
                })
              ),
            {
              role: "user",
              content:
                userMsg.content,
            },
          ];

        try {
          const result =
            await invoke<ChatReply>(
              "chat_with_ollama",
              {
                messages:
                  payloadMessages,
                model,
                mode,
              }
            );

          if (
            !result.success
          ) {
            setError(
              result.error ||
              "Interview failed."
            );

            setMessages(
              (
                prev
              ) =>
                prev.filter(
                  (
                    m
                  ) =>
                    m.id !==
                    assistantId
                )
            );
          } else {
            setMessages(
              (prev) =>
                prev.map(
                  (m) =>
                    m.id ===
                      assistantId
                      ? {
                        ...m,
                        content:
                          m.content.trim() ||
                          result.response.trim(),
                      }
                      : m
                )
            );

            if (
              mode !==
              "interview_practice"
            ) {
              setRound(
                (
                  r
                ) => r + 1
              );
            }

            // Speak whatever is left in the buffer
            const remaining = result.response.slice(spokenTextRef.current.length);
            if (remaining.trim()) {
              speak(remaining, false);
            }
            spokenTextRef.current = "";
          }
        } catch (
        e
        ) {
          setError(
            String(e)
          );

          setMessages(
            (
              prev
            ) =>
              prev.filter(
                (
                  m
                ) =>
                  m.id !==
                  assistantId
              )
          );
        } finally {
          activeAssistantId.current =
            null;

          setIsLoading(
            false
          );
        }
      },
      [
        contextIntro,
        isLoading,
        messages,
        mode,
        model,
        prompt,
        speak,
        stopSpeechRecognition,
      ]
    );

  const handleFinishInterview = useCallback(async () => {
    if (messages.length < 2 || isLoading) return;

    setIsLoading(true);
    setAiState("thinking");
    window.speechSynthesis?.cancel();

    const summaryPrompt = `The interview is over. Please provide a final analysis of the candidate's performance based on our conversation. 
    Format your response EXACTLY as a JSON object with these keys: 
    "confidence" (e.g. "85%"), 
    "technical" (e.g. "Strong"), 
    "communication" (e.g. "Excellent"), 
    "feedback" (detailed markdown summary). 
    Do not include any other text or markdown code blocks in your response, just the raw JSON.`;

    try {
      const result = await invoke<ChatReply>("chat_with_ollama", {
        messages: [
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: summaryPrompt }
        ],
        model,
        mode: "general", // Use general mode for summary to avoid interviewer persona
      });

      if (result.success) {
        try {
          // Clean the response in case the AI included markdown blocks
          const cleanJson = result.response.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          setAnalysis({
            confidence: parsed.confidence || "N/A",
            technical: parsed.technical || "N/A",
            communication: parsed.communication || "N/A",
            feedback: parsed.feedback || result.response,
          });
          setActiveTab("analysis");
          
          // Save report if linked to a job
          if (session?.job_id) {
             // In a real app, we'd call a save_interview_report command here
             console.log("Saving interview report for job", session.job_id);
          }

          // Reset interview state
          setMessages([]);
          sessionStorage.removeItem(KEY);
          spokenTextRef.current = "";
        } catch (e) {
          // Fallback if JSON parsing fails
          setAnalysis({
            confidence: "Analyzed",
            technical: "Analyzed",
            communication: "Analyzed",
            feedback: result.response,
          });
          setActiveTab("analysis");
          setMessages([]);
          sessionStorage.removeItem(KEY);
        }
      }
    } catch (e) {
      setError("Failed to generate interview analysis.");
    } finally {
      setIsLoading(false);
      setAiState("idle");
    }
  }, [messages, model, isLoading]);

  const startSpeechRecognition =
    useCallback(() => {
      const ctor =
        (
          window as unknown as {
            SpeechRecognition?: SpeechRecognitionCtor;
            webkitSpeechRecognition?: SpeechRecognitionCtor;
          }
        )
          .SpeechRecognition ||
        (
          window as unknown as {
            webkitSpeechRecognition?: SpeechRecognitionCtor;
          }
        )
          .webkitSpeechRecognition;

      if (!ctor) {
        setError(
          "Speech recognition unavailable."
        );

        return;
      }

      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();
      }

      const recognition =
        new ctor();

      recognition.continuous =
        true;

      recognition.interimResults =
        true;

      recognition.lang =
        "en-US";

      recognition.onresult =
        (event) => {
          let transcript =
            "";

          for (
            let i = 0;
            i <
            event.results.length;
            i++
          ) {
            transcript +=
              event.results[i][0]
                .transcript + " ";
          }

          const cleaned =
            transcript.trim();

          setPrompt(
            cleaned
          );

          if (
            silenceTimeoutRef.current
          ) {
            clearTimeout(
              silenceTimeoutRef.current
            );
          }

          silenceTimeoutRef.current =
            window.setTimeout(
              () => {
                if (
                  cleaned &&
                  !isLoading
                ) {
                  shouldRestartRef.current = true;
                  stopSpeechRecognition(false);
                  void sendTurn(
                    undefined,
                    cleaned
                  );
                }
              },
              1600
            );
        };

      recognition.onerror =
        () => {
          setIsListening(
            false
          );

          setAiState(
            "idle"
          );
        };

      recognition.onend =
        () => {
          if (
            recognitionRef.current &&
            isListening
          ) {
            try {
              recognition.start();
            } catch {
              //
            }
          }
        };

      recognitionRef.current =
        recognition;

      setIsListening(
        true
      );

      setAiState(
        "listening"
      );

      recognition.start();
    }, [
      isListening,
      isLoading,
      sendTurn,
      stopSpeechRecognition
    ]);

  /*
    AUTO-RESTART RECOGNITION AFTER AI FINISHES
  */
  useEffect(() => {
    if (aiState === "idle" && shouldRestartRef.current && !isLoading && !isSpeaking) {
      shouldRestartRef.current = false;
      startSpeechRecognition();
    }
  }, [aiState, isLoading, isSpeaking, startSpeechRecognition]);

  const startInterview =
    async () => {
      try {
        setMessages([]);
        setRound(1);
        setElapsedSec(0);

        // Save session to DB
        await db.createInterviewSession(
          mode,
          jobContext,
          undefined, // company
          undefined, // job_id
          jobContext, // job_description
          inputSource, // experience_level
          personality,
          resumeContext
        );

        await sendTurn(
          undefined,
          "Start the interview with the first question."
        );
      } catch (err) {
        console.error("Failed to start interview session", err);
        setError("Failed to start interview session. Please try again.");
      }
    };

  const latestAssistantMessage =
    liveAssistantText ||
    [...messages]
      .reverse()
      .find(
        (m) =>
          m.role ===
          "assistant"
      )?.content ||
    "";


  return (
    <section className="flex h-[calc(100vh-4.5rem)] gap-5 overflow-hidden">

      {/* LEFT */}
      <InterviewSetupPanel
        role={jobContext}
        setRole={setJobContext}

        level={inputSource}
        setLevel={setInputSource}

        type={mode}
        setType={setMode}

        jobDescription={jobContext}
        setJobDescription={setJobContext}

        resumeContext={resumeContext}
        setResumeContext={setResumeContext}

        personality={personality}
        setPersonality={setPersonality}

        startInterview={() => {
          void startInterview();
        }}

        finishInterview={() => {
          void handleFinishInterview();
        }}
      />

      {/* RIGHT */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden">

        {/* HEADER */}
        <InterviewHeader
          aiState={aiState}
          onFinish={() => {
            void handleFinishInterview();
          }}
        />

        {/* TABS */}
        <InterviewTabs
          messages={messages}
          latestMessage={
            latestAssistantMessage
          }
          speaking={isSpeaking}
          listening={isListening}
          thinking={isLoading}
          aiState={aiState}
          analysis={analysis}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* DOCK */}
        <VoiceDock
          listening={
            isListening
          }
          input={prompt}
          setInput={
            setPrompt
          }
          onSend={() =>
            void sendTurn()
          }
          toggleListening={() => {
            if (
              isListening
            ) {
              stopSpeechRecognition();
            } else {
              startSpeechRecognition();
            }
          }}
        />

        {/* ERROR */}
        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

      </div>

    </section>
  );
}
