import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, MessageCircle } from "lucide-react";
import { api } from "./lib";
export default function Tutor({
  lesson,
  activity,
  focus,
  available,
}: {
  available: boolean;
  lesson?: number;
  activity: string;
  focus?: string;
}) {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [messages, setMessages] = useState<
      { role: "user" | "assistant"; content: string }[]
    >([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({
      top: box.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);
  async function send(text = input) {
    if (!text.trim() || busy || !available) return;
    const next = [
      ...messages,
      { role: "user" as const, content: text.trim() },
    ].slice(-11);
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const d = await api("/api/tutor", {
        method: "POST",
        body: JSON.stringify({ lesson, activity, focus, messages: next }),
      });
      setMessages([...next, { role: "assistant", content: d.answer }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="tutor-launch"
        onClick={() => setOpen(true)}
        aria-label="Open AI study tutor"
      >
        <img src="/art/Fox.webp" alt="" />
        <span>
          Ask Mei <Sparkles size={15} />
        </span>
      </button>
      {open && (
        <aside
          className="tutor"
          role="dialog"
          aria-modal="false"
          aria-label="AI study tutor"
        >
          <header>
            <span className="tutor-avatar">
              <MessageCircle />
            </span>
            <div>
              <strong>Your study buddy</strong>
              <small>
                {lesson ? `Lesson ${lesson} · ` : ""}
                {activity}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close AI tutor"
            >
              <X />
            </button>
          </header>
          <div className="chat-scroll" ref={box}>
            {messages.length === 0 && (
              <div className="tutor-welcome">
                <Sparkles size={28} />
                <h3>Let’s figure it out.</h3>
                {!available && (
                  <p role="status">
                    The online tutor needs a connection, a configured service
                    and Google sign-in. Your lesson notes and practice tools are
                    available without it.
                  </p>
                )}
                <p>
                  Ask about this lesson, build an answer, or try a short
                  conversation.
                </p>
                {[
                  "Explain this lesson simply",
                  "Ask me one speaking question",
                  "Help me make a natural sentence",
                ].map((t) => (
                  <button key={t} onClick={() => send(t)}>
                    {t} ↗
                  </button>
                ))}
                <small>
                  Your question and selected lesson context go to DeepSeek.
                  Replies can be imperfect; check the source notes.
                </small>
              </div>
            )}
            {messages.map((m, i) => (
              <div className={"bubble " + m.role} key={i}>
                <small>{m.role === "user" ? "You" : "Mei · AI tutor"}</small>
                <div>{m.content}</div>
              </div>
            ))}
            {busy && (
              <p className="typing" role="status">
                Mei is thinking <span>•••</span>
              </p>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label className="sr-only" htmlFor="tutor-question">
              Ask your study tutor
            </label>
            <textarea
              id="tutor-question"
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How do I use 会 and 能?"
              rows={2}
            />
            <button
              className="icon-button primary"
              disabled={!available || busy || !input.trim()}
              aria-label="Send question"
            >
              <Send size={19} />
            </button>
          </form>
          <small className="tutor-foot">
            Study help · no official grading · no voice upload
          </small>
        </aside>
      )}
    </>
  );
}
