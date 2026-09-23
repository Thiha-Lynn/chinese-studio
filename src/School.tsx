import {
  ArrowUpRight,
  BookOpen,
  Globe,
  GraduationCap,
  MessageCircle,
} from "lucide-react";
import { brand } from "./brand";

export default function School() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">WELCOME TO ESC · 欢迎</span>
        <h1>
          Your next chapter
          <br />
          starts with Chinese.
        </h1>
        <p>
          {brand.fullName} · <span lang="zh">{brand.chineseName}</span>
        </p>
      </div>
      <section className="school-banner panel">
        <span className="school-seal" aria-hidden="true">
          ESC<small>学 · 练 · 用</small>
        </span>
        <div>
          <span className="eyebrow">LEARN. PRACTISE. CONNECT.</span>
          <h2>A place to grow your Chinese.</h2>
          <p>
            Explore lessons here, build a daily practice habit, and connect with
            ESC for online and on-campus classes.
          </p>
          <a
            className="btn"
            href={brand.facebook}
            target="_blank"
            rel="noreferrer"
          >
            Visit ESC on Facebook <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <div className="school-grid">
        {[
          [
            GraduationCap,
            "HSK & Hanyu classes",
            "Explore Chinese language study with ESC. Contact the school to find the right class for your level.",
          ],
          [
            Globe,
            "Online & on campus",
            "Ask ESC about current class formats, schedules, course fees and enrolment availability.",
          ],
          [
            BookOpen,
            "Practice between classes",
            "Use the included Chinese 1 and Chinese 2 libraries for vocabulary, listening, speaking and handwriting practice.",
          ],
        ].map(([Icon, title, detail]) => {
          const Symbol = Icon as typeof BookOpen;
          return (
            <section className="panel" key={String(title)}>
              <Symbol className="school-feature-icon" size={26} />
              <h2>{String(title)}</h2>
              <p>{String(detail)}</p>
            </section>
          );
        })}
      </div>
      <section className="panel row between">
        <div>
          <h2>Find your class at ESC.</h2>
          <p>See the school’s latest announcements and contact details.</p>
        </div>
        <a
          className="btn secondary"
          href={brand.facebook}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} /> School updates <ArrowUpRight size={17} />
        </a>
      </section>
      <p className="muted">
        The practice library includes attributed third-party course materials.
        Class enrolment and school announcements are managed by ESC through its
        Facebook page.
      </p>
    </>
  );
}
