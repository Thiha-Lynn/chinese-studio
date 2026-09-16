import { useEffect, useRef, useState } from "react";
import { Mic, Square, Download } from "lucide-react";
export default function Recorder() {
  const [status, setStatus] = useState(""),
    [url, setUrl] = useState(""),
    [recording, setRecording] = useState(false),
    [extension, setExtension] = useState("webm"),
    [requesting, setRequesting] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    blobUrl = useRef(""),
    mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      recorder.current?.state === "recording" && recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    },
    [],
  );
  async function start() {
    setRequesting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setStatus("Recording is not supported in this browser.");
        return;
      }
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!mounted.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        return;
      }
      const r = new MediaRecorder(stream.current);
      setExtension(
        r.mimeType.includes("mp4")
          ? "m4a"
          : r.mimeType.includes("ogg")
            ? "ogg"
            : "webm",
      );
      recorder.current = r;
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        if (timer.current) clearTimeout(timer.current);
        if (!mounted.current) return;
        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = URL.createObjectURL(
          new Blob(chunks, { type: r.mimeType }),
        );
        setUrl(blobUrl.current);
        setRecording(false);
        setStatus("Listen back, then compare with the example.");
      };
      r.start();
      setRecording(true);
      setStatus("Recording… up to 90 seconds.");
      timer.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 90000);
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      setStatus(
        "Microphone access was unavailable. You can still practise out loud.",
      );
    } finally {
      if (mounted.current) setRequesting(false);
    }
  }
  return (
    <div className="recorder">
      <div className="row">
        <button
          disabled={requesting}
          className={recording ? "btn danger" : "btn secondary"}
          onClick={() => (recording ? recorder.current?.stop() : start())}
        >
          {recording ? <Square size={17} /> : <Mic size={17} />}{" "}
          {recording ? "Stop recording" : "Record my answer"}
        </button>
        {url && (
          <a
            className="icon-button"
            href={url}
            download={`chinese-practice.${extension}`}
            aria-label="Download my recording"
          >
            <Download size={18} />
          </a>
        )}
      </div>
      {url && <audio controls src={url} />}
      <small>
        {status || "Optional · stays on this device · never sent to the tutor"}
      </small>
    </div>
  );
}
