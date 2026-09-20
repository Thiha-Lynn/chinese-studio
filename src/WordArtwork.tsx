import { useState } from "react";
import type { Word } from "./types";

/** Keep original illustrations; use a complete character card when art is absent or unavailable. */
export default function WordArtwork({
  word,
  showPinyin = true,
}: {
  word: Word;
  showPinyin?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const illustrated = !!word.image && failedSource !== word.image;
  return (
    <>
      <span
        className={
          "word-artwork " + (illustrated ? "illustrated" : "character-art")
        }
      >
        {illustrated ? (
          <img
            loading="lazy"
            src={word.image}
            alt={`Illustration for ${word.hanzi}`}
            onError={() => setFailedSource(word.image)}
          />
        ) : (
          <>
            <span className="character-art-label" aria-hidden="true">
              ESC · 学
            </span>
            <span
              className={
                "character-art-text " + (word.hanzi.length > 4 ? "long" : "")
              }
              lang="zh"
              aria-hidden="true"
            >
              {word.hanzi}
            </span>
            <span className="character-art-rule" aria-hidden="true" />
          </>
        )}
      </span>
      <strong
        lang="zh"
        className={
          "hanzi " +
          (word.hanzi.length > 4 ? "long " : "") +
          (illustrated ? "" : "sr-only")
        }
      >
        {word.hanzi}
      </strong>
      {showPinyin && <span className="pinyin">{word.pinyin}</span>}
    </>
  );
}
