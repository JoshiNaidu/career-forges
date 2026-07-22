import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { invoke } from "@tauri-apps/api/core";

import { listen } from "@tauri-apps/api/event";

import ReactMarkdown from "react-markdown";

import remarkGfm from "remark-gfm";

import rehypeSanitize from "rehype-sanitize";

import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  getCurrentModel,
  getCurrentProvider,
} from "../lib/ai-preferences";

type ChatReply = {
  success: boolean;
  model: string;
  response: string;
  error?: string | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatInputMessage = {
  role: "user" | "assistant";
  content: string;
};

const SESSION_KEY =
  "cf_chat_session_v1";

function loadSessionMessages(): ChatMessage[] {
  try {
    const raw =
      sessionStorage.getItem(
        SESSION_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      ) as ChatMessage[];

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id ===
        "string" &&
        (item.role ===
          "user" ||
          item.role ===
          "assistant") &&
        typeof item.content ===
        "string"
    );
  } catch {
    return [];
  }
}

function formatAssistantText(
  input: string
): string {
  return input
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatPage() {
  const [prompt, setPrompt] =
    useState("");

  const [model, setModel] =
    useState("");

  const [provider, setProvider] =
    useState("");

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>(
      loadSessionMessages
    );

  const listRef =
    useRef<HTMLDivElement>(
      null
    );

  const activeAssistantId =
    useRef<string | null>(
      null
    );

  const agentName =
    localStorage.getItem(
      "ai_agent_name"
    ) || model;

  /*
    SYNC AI PREFERENCES
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
    PERSIST CHAT
  */
  useEffect(() => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(
        messages
      )
    );
  }, [messages]);

  /*
    AUTO SCROLL
  */
  useEffect(() => {
    if (
      listRef.current
    ) {
      const scrollElement =
        listRef.current;

      scrollElement.scrollTop =
        scrollElement.scrollHeight;
    }
  }, [messages]);

  /*
    CONTEXT WINDOW
  */
  const contextMessages =
    useMemo<
      ChatInputMessage[]
    >(
      () =>
        messages
          .slice(-10)
          .map(
            (
              message
            ) => ({
              role: message.role,
              content:
                message.content,
            })
          ),
      [messages]
    );

  /*
    STREAM LISTENER
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
          if (
            !activeAssistantId.current ||
            event.payload.mode !== "general"
          ) {
            return;
          }

          const chunk =
            event.payload
              ?.chunk ?? "";

          if (!chunk) {
            return;
          }

          setMessages(
            (
              prev
            ) =>
              prev.map(
                (
                  msg
                ) =>
                  msg.id ===
                    activeAssistantId.current
                    ? {
                      ...msg,
                      content: `${msg.content}${chunk}`,
                    }
                    : msg
              )
          );
        }
      );

    return () => {
      void unlistenPromise.then(
        (
          unlisten
        ) =>
          unlisten()
      );
    };
  }, []);

  /*
    SEND MESSAGE
  */
  const handleSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (
        isLoading ||
        !prompt.trim()
      ) {
        return;
      }

      const userMessage: ChatMessage =
      {
        id: `${Date.now()}-user`,
        role: "user",
        content:
          prompt.trim(),
      };

      setMessages(
        (prev) => [
          ...prev,
          userMessage,
        ]
      );

      setError(null);

      setIsLoading(true);

      setPrompt("");

      const assistantId =
        `${Date.now()}-assistant`;

      activeAssistantId.current =
        assistantId;

      setMessages(
        (prev) => [
          ...prev,
          {
            id: assistantId,
            role:
              "assistant",
            content: "",
          },
        ]
      );

      try {
        const result =
          await invoke<ChatReply>(
            "chat_with_ollama",
            {
              messages: [
                ...contextMessages,
                {
                  role: "user",
                  content:
                    userMessage.content,
                },
              ],
              model,
              mode: "general",
            }
          );

        if (
          result.success
        ) {
          setMessages(
            (
              prev
            ) =>
              prev.map(
                (
                  msg
                ) =>
                  msg.id ===
                    assistantId
                    ? {
                      ...msg,
                      content:
                        formatAssistantText(
                          msg.content ||
                          result.response ||
                          "(No response text returned)"
                        ),
                    }
                    : msg
              )
          );
        } else {
          setError(
            result.error ||
            "Unknown error from Ollama."
          );

          setMessages(
            (
              prev
            ) =>
              prev.filter(
                (
                  msg
                ) =>
                  msg.id !==
                  assistantId
              )
          );
        }
      } catch (
      invokeError
      ) {
        setError(
          String(
            invokeError
          )
        );

        setMessages(
          (
            prev
          ) =>
            prev.filter(
              (
                msg
              ) =>
                msg.id !==
                assistantId
            )
        );
      } finally {
        activeAssistantId.current =
          null;

        setIsLoading(
          false
        );

        window.setTimeout(
          () => {
            if (
              listRef.current
            ) {
              listRef.current.scrollTo(
                {
                  top: listRef
                    .current
                    .scrollHeight,
                  behavior:
                    "smooth",
                }
              );
            }
          },
          80
        );
      }
    };

  return (
    <section className="mx-auto flex h-[calc(100vh-140px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] chat-surface shadow-2xl backdrop-blur-xl">
      {/* HEADER */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              CareerForges Chat
            </h1>

            <p className="mt-1 text-xs text-[var(--muted)]">
              {String(
                provider || ""
              ).toUpperCase()}{" "}
              • {agentName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />

            <span className="text-xs text-[var(--muted)]">
              Local AI Running
            </span>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-3"
      >
        {messages.length ===
          0 ? (
          <div className="glass rounded-2xl p-5 text-sm text-[var(--muted)] backdrop-blur-xl">
            Ask me anything
            about resumes,
            interviews,
            ATS optimization,
            applications,
            or career growth.
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map(
            (
              message
            ) => (
              <motion.div
                key={
                  message.id
                }
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
                className={`flex w-full ${
                  message.role ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`
                  max-w-[78%]
                  rounded-3xl
                  px-5
                  py-2
                  text-[15px]
                  leading-6
                  tracking-[0.01em]
                  shadow-xl
                  transition-all
                  duration-200
                  ${
                    message.role ===
                    "user"
                      ? `
                      message-user
                    `
                      : `
                      message-assistant
                    `
                  }
                  `}
                >
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                    ]}
                    rehypePlugins={[
                      rehypeHighlight,
                      rehypeSanitize,
                    ]}
                    components={{
                      h1: ({
                        children,
                      }) => (
                        <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-[var(--text)]">
                          {
                            children
                          }
                        </h1>
                      ),

                      h2: ({
                        children,
                      }) => (
                        <h2 className="mb-3 mt-5 text-xl font-semibold text-[var(--text)]">
                          {
                            children
                          }
                        </h2>
                      ),

                      h3: ({
                        children,
                      }) => (
                        <h3 className="mb-3 mt-4 text-lg font-semibold text-[var(--text)]">
                          {
                            children
                          }
                        </h3>
                      ),

                      p: ({
                        children,
                      }) => (
                        <p className="mb-1.5 leading-6 text-[var(--text)]">
                          {
                            children
                          }
                        </p>
                      ),

                      ul: ({
                        children,
                      }) => (
                        <ul className="mb-5 list-disc space-y-1 pl-6 text-[var(--text)]">
                          {
                            children
                          }
                        </ul>
                      ),

                      ol: ({
                        children,
                      }) => (
                        <ol className="mb-5 list-decimal space-y-1 pl-6 text-[var(--text)]">
                          {
                            children
                          }
                        </ol>
                      ),

                      li: ({
                        children,
                      }) => (
                        <li className="leading-6 marker:text-orange-400">
                          {
                            children
                          }
                        </li>
                      ),

                      strong: ({
                        children,
                      }) => (
                        <strong className="font-semibold text-[var(--text)]">
                          {
                            children
                          }
                        </strong>
                      ),

                      em: ({
                        children,
                      }) => (
                        <em className="italic text-[var(--text)]">
                          {
                            children
                          }
                        </em>
                      ),

                      code: ({
                        children,
                      }) => (
                        <code className="rounded-lg bg-[var(--surface)] px-1.5 py-1 font-mono text-[13px] text-orange-300">
                          {
                            children
                          }
                        </code>
                      ),

                      pre: ({
                        children,
                      }) => (
                        <pre className="mb-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 text-sm shadow-inner">
                          {
                            children
                          }
                        </pre>
                      ),

                      blockquote:
                        ({
                          children,
                        }) => (
                          <blockquote className="mb-5 border-l-2 border-orange-500/40 pl-4 italic text-[var(--muted)]">
                            {
                              children
                            }
                          </blockquote>
                        ),

                      a: ({
                        href,
                        children,
                      }) => (
                        <a
                          href={
                            href
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-orange-400 underline underline-offset-4 transition hover:text-orange-300"
                        >
                          {
                            children
                          }
                        </a>
                      ),

                      table: ({
                        children,
                      }) => (
                        <div className="mb-5 overflow-x-auto">
                          <table className="w-full border-collapse text-left">
                            {
                              children
                            }
                          </table>
                        </div>
                      ),

                      th: ({
                        children,
                      }) => (
                        <th className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted)]">
                          {
                            children
                          }
                        </th>
                      ),

                      td: ({
                        children,
                      }) => (
                        <td className="border-b border-[var(--border)] px-3 py-2 text-[var(--text)]">
                          {
                            children
                          }
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {isLoading &&
                  activeAssistantId.current ===
                    message.id ? (
                    <span className="ml-1 inline-block animate-pulse text-orange-400">
                      ▋
                    </span>
                  ) : null}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {isLoading ? (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="w-fit glass rounded-2xl px-4 py-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:120ms]" />

                <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:240ms]" />
              </div>

              <span className="text-sm text-[var(--muted)]">
                Thinking...
              </span>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* INPUT */}
      <form
        onSubmit={
          handleSubmit
        }
        className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-5 backdrop-blur-xl"
      >
        <div className="flex items-end gap-3">
          <textarea
            value={prompt}
            onChange={(
              event
            ) =>
              setPrompt(
                event.target
                  .value
              )
            }
            disabled={
              isLoading
            }
            rows={1}
            className="
            min-h-[52px]
            max-h-40
            flex-1
            resize-none
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface-2)]
            px-4
            py-3
            text-[15px]
            text-[var(--text)]
            placeholder:text-[var(--muted)]
            outline-none
            transition-all
            focus:border-orange-500/40
            focus:bg-white/[0.06]
            focus:shadow-[0_0_0_4px_rgba(249,115,22,0.08)]
            "
            placeholder="Message CareerForges..."
          />

          <button
            type="submit"
            disabled={
              isLoading
            }
            className="
            flex
            h-[52px]
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-orange-500
            to-orange-600
            px-5
            text-sm
            font-medium
            text-[var(--text)]
            shadow-lg
            shadow-orange-500/20
            transition-all
            hover:scale-[1.02]
            hover:from-orange-400
            hover:to-orange-500
            disabled:cursor-not-allowed
            disabled:opacity-50
            "
          >
            Send
          </button>
        </div>
      </form>

      {/* ERROR */}
      {error ? (
        <div className="mx-5 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      ) : null}
    </section>
  );
}