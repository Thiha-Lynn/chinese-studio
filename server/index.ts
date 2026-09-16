import { progressSchema } from "../src/progress.ts";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import * as oidc from "openid-client";
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { allowedIdentity, sameOrigin, tutorInstruction } from "./policy.ts";
import { freshProgress, type Course, type User } from "../src/types.ts";

const root = process.cwd(),
  production = process.env.NODE_ENV === "production";
const origin = new URL(process.env.APP_ORIGIN || "http://127.0.0.1:4173")
  .origin;
if (production && !origin.startsWith("https://"))
  throw new Error("Production requires APP_ORIGIN=https://…");
const preview =
  !production &&
  process.env.LOCAL_PREVIEW === "1" &&
  ["127.0.0.1", "localhost"].includes(new URL(origin).hostname);
const mode = process.env.ACCESS_MODE || "google";
if (!["google", "mfu"].includes(mode)) throw new Error("Invalid ACCESS_MODE");
const domains = (process.env.ALLOWED_GOOGLE_DOMAINS || "lamduan.mfu.ac.th")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const dataPath = process.env.DATA_DIR || path.join(root, "var");
mkdirSync(dataPath, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path.join(dataPath, "studio.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,hd TEXT,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS oauth(hash TEXT PRIMARY KEY,state TEXT NOT NULL,nonce TEXT NOT NULL,verifier TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY REFERENCES users(id),payload TEXT NOT NULL,updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS quota(user_id TEXT NOT NULL,day TEXT NOT NULL,requests INTEGER NOT NULL,PRIMARY KEY(user_id,day));`);
const course = JSON.parse(
  readFileSync(path.join(root, "content/course.json"), "utf8"),
) as Course;
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(production ? {} : { upgradeInsecureRequests: null }),
      },
    },
    strictTransportSecurity: production
      ? { maxAge: 31536000, includeSubDomains: false }
      : false,
    referrerPolicy: { policy: "no-referrer" },
  }),
);
app.use((_q, r, n) => {
  r.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
  n();
});
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const random = () => randomBytes(32).toString("base64url");
const cookieOptions = {
  httpOnly: true,
  secure: production,
  sameSite: "lax" as const,
  path: "/",
};
const sessionCookie = production ? "__Host-chinese_session" : "chinese_session";
const loginCookie = production ? "__Host-chinese_login" : "chinese_login";
function userFor(req: express.Request): User | null {
  if (preview)
    return {
      id: "local-preview",
      email: "preview@localhost",
      name: "Local learner",
      preview: true,
    };
  const token = req.cookies[sessionCookie];
  if (typeof token !== "string") return null;
  const row = db
    .prepare(
      "SELECT u.id,u.email,u.name,u.hd FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.hash=? AND s.expires>?",
    )
    .get(digest(token), Date.now()) as any;
  if (
    !row ||
    !allowedIdentity(
      { sub: row.id, email: row.email, email_verified: true, hd: row.hd },
      mode,
      domains,
    )
  )
    return null;
  return { id: row.id, email: row.email, name: row.name };
}
const requireUser: express.RequestHandler = (q, r, n) => {
  const user = userFor(q);
  if (!user) {
    r.status(401).json({ error: "Please sign in with Google to continue." });
    return;
  }
  r.locals.user = user;
  n();
};
const csrf: express.RequestHandler = (q, r, n) => {
  if (!sameOrigin(q.headers.origin, origin)) {
    r.status(403).json({ error: "Request origin rejected." });
    return;
  }
  n();
};
const noStore: express.RequestHandler = (_q, r, n) => {
  r.set("Cache-Control", "private, no-store");
  n();
};
app.use(["/api", "/auth"], noStore);
app.get("/api/health", (_q, r) =>
  r.json({ status: "ok", service: "chinese-studio" }),
);
app.get("/api/session", (q, r) =>
  r.json({
    user: userFor(q),
    authReady: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    aiReady: !!process.env.DEEPSEEK_API_KEY,
    mode,
    preview,
  }),
);
let authConfig: Promise<oidc.Configuration> | undefined;
function configuration() {
  if (!authConfig)
    authConfig = oidc
      .discovery(
        new URL("https://accounts.google.com"),
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
      )
      .then((c) => {
        oidc.enableNonRepudiationChecks(c);
        return c;
      })
      .catch((e) => {
        authConfig = undefined;
        throw e;
      });
  return authConfig;
}
app.get(
  "/auth/google",
  rateLimit({
    windowMs: 600000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (_q, r) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      r.redirect("/?auth=setup");
      return;
    }
    try {
      const config = await configuration(),
        verifier = oidc.randomPKCECodeVerifier(),
        state = oidc.randomState(),
        nonce = oidc.randomNonce(),
        handle = random();
      db.prepare("DELETE FROM oauth WHERE expires<?").run(Date.now());
      db.prepare("INSERT INTO oauth VALUES(?,?,?,?,?)").run(
        digest(handle),
        state,
        nonce,
        verifier,
        Date.now() + 600000,
      );
      r.cookie(loginCookie, handle, { ...cookieOptions, maxAge: 600000 });
      r.redirect(
        oidc.buildAuthorizationUrl(config, {
          redirect_uri: origin + "/auth/callback",
          scope: "openid email profile",
          code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
          code_challenge_method: "S256",
          state,
          nonce,
          prompt: "select_account",
        }).href,
      );
    } catch {
      r.redirect("/?auth=unavailable");
    }
  },
);
app.get("/auth/callback", async (q, r) => {
  const handle = q.cookies[loginCookie];
  r.clearCookie(loginCookie, cookieOptions);
  if (typeof handle !== "string") {
    r.redirect("/?auth=expired");
    return;
  }
  const stored = db
    .prepare("DELETE FROM oauth WHERE hash=? AND expires>? RETURNING *")
    .get(digest(handle), Date.now()) as any;
  if (!stored) {
    r.redirect("/?auth=expired");
    return;
  }
  try {
    const config = await configuration(),
      tokens = await oidc.authorizationCodeGrant(
        config,
        new URL(q.originalUrl, origin),
        {
          pkceCodeVerifier: stored.verifier,
          expectedState: stored.state,
          expectedNonce: stored.nonce,
          idTokenExpected: true,
        },
      );
    const claims = tokens.claims() as Record<string, unknown>;
    if (!claims || !allowedIdentity(claims, mode, domains)) {
      r.redirect("/?auth=restricted");
      return;
    }
    db.prepare(
      "INSERT INTO users VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name,hd=excluded.hd",
    ).run(
      String(claims.sub),
      String(claims.email),
      String(claims.name || "Learner").slice(0, 100),
      typeof claims.hd === "string" ? claims.hd : null,
      Date.now(),
    );
    const old = q.cookies[sessionCookie];
    if (typeof old === "string")
      db.prepare("DELETE FROM sessions WHERE hash=?").run(digest(old));
    const token = random();
    db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      digest(token),
      String(claims.sub),
      Date.now() + 7 * 86400000,
    );
    r.cookie(sessionCookie, token, { ...cookieOptions, maxAge: 7 * 86400000 });
    r.redirect("/learn");
  } catch {
    r.redirect("/?auth=failed");
  }
});
app.post("/auth/logout", csrf, (q, r) => {
  const token = q.cookies[sessionCookie];
  if (typeof token === "string")
    db.prepare("DELETE FROM sessions WHERE hash=?").run(digest(token));
  r.clearCookie(sessionCookie, cookieOptions);
  r.json({ ok: true });
});
if (preview)
  db.prepare("INSERT OR IGNORE INTO users VALUES(?,?,?,?,?)").run(
    "local-preview",
    "preview@localhost",
    "Local learner",
    null,
    Date.now(),
  );
app.get("/api/course", (_q, r) => r.json(course));
app.get("/api/progress", requireUser, (_q, r) => {
  const row = db
    .prepare("SELECT payload FROM progress WHERE user_id=?")
    .get(r.locals.user.id) as any;
  r.json(row ? JSON.parse(row.payload) : freshProgress());
});
app.put("/api/progress", requireUser, csrf, (q, r) => {
  const parsed = progressSchema.safeParse(q.body);
  if (!parsed.success) {
    r.status(400).json({ error: "Invalid progress file." });
    return;
  }
  db.prepare(
    "INSERT INTO progress VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated",
  ).run(r.locals.user.id, JSON.stringify(parsed.data), Date.now());
  r.json({ ok: true });
});
app.delete("/api/account", requireUser, csrf, (_q, r) => {
  const id = r.locals.user.id;
  db.exec("BEGIN");
  try {
    for (const table of ["sessions", "progress", "quota"])
      db.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(id);
    db.prepare("DELETE FROM users WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  r.clearCookie(sessionCookie, cookieOptions);
  r.json({ ok: true });
});
const tutorSchema = z.object({
  lesson: z.number().int().min(1).max(10).optional(),
  activity: z.string().max(80),
  focus: z.string().max(500).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(12),
});
app.post(
  "/api/tutor",
  requireUser,
  csrf,
  rateLimit({
    windowMs: 60000,
    limit: 8,
    keyGenerator: (_q, r) => r.locals.user.id,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (q, r) => {
    const parsed = tutorSchema.safeParse(q.body);
    if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
      r.status(400).json({ error: "Please send a short study question." });
      return;
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      r.status(503).json({
        error:
          "The tutor is awaiting its server API configuration. All study tools remain available.",
      });
      return;
    }
    const id = r.locals.user.id,
      day = new Date().toISOString().slice(0, 10),
      dailyLimit = Number(process.env.AI_DAILY_LIMIT || 40);
    const budget = db
      .prepare("SELECT requests FROM quota WHERE user_id=? AND day=?")
      .get(id, day) as any;
    if (budget && budget.requests >= dailyLimit) {
      r.status(429).json({
        error:
          "You’ve reached today’s tutor limit. Your practice tools are still ready.",
      });
      return;
    }
    db.prepare(
      "INSERT INTO quota VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET requests=requests+1",
    ).run(id, day);
    const { lesson, activity, focus, messages } = parsed.data,
      l = course.lessons.find((x) => x.id === lesson);
    const context = JSON.stringify({
      activity,
      focus,
      lesson: l
        ? {
            title: l.title,
            grammar: l.grammar,
            slides: l.slides
              .map((s) => s.text)
              .join("\n")
              .slice(0, 14000),
            words: course.vocab
              .filter((w) => w.lesson === lesson)
              .map(({ hanzi, pinyin, meaning, note }) => ({
                hanzi,
                pinyin,
                meaning,
                note,
              })),
          }
        : undefined,
      scope: "Chinese 2. Chinese 1 pending authorized import.",
    });
    try {
      const result = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
          messages: [
            { role: "system", content: tutorInstruction(context) },
            ...messages,
          ],
          max_tokens: 900,
          thinking: { type: "disabled" },
          stream: false,
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!result.ok) {
        r.status(502).json({
          error:
            "The tutor provider is temporarily unavailable. Try again shortly.",
        });
        return;
      }
      const answer = (await result.json()) as any;
      const content = answer?.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Missing content");
      r.json({ answer: content.slice(0, 12000) });
    } catch {
      r.status(502).json({
        error: "The tutor couldn’t finish this reply. Please try again.",
      });
    }
  },
);
app.use(
  "/library",
  express.static(path.join(root, "build/client/library"), {
    dotfiles: "deny",
    index: false,
    maxAge: 0,
    fallthrough: false,
  }),
);
app.get("/robots.txt", (_q, r) =>
  r
    .type("text")
    .send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /library/\nSitemap: ${origin}/sitemap.xml\n`,
    ),
);
app.get("/sitemap.xml", (_q, r) =>
  r
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/privacy</loc></url></urlset>`,
    ),
);
app.use(
  express.static(path.join(root, "build/client"), {
    index: false,
    maxAge: 0,
  }),
);
app.use("/api", (_q, r) => r.status(404).json({ error: "Not found." }));
app.use("/auth", (_q, r) => r.status(404).send("Not found."));
app.get("/{*path}", (q, r) => {
  const file = path.join(root, "build/client/index.html");
  if (!existsSync(file)) {
    r.status(503).send("Run npm run build first.");
    return;
  }
  if (!["/", "/privacy", "/terms"].includes(q.path))
    r.set("X-Robots-Tag", "noindex");
  r.type("html").send(readFileSync(file, "utf8"));
});
app.use(
  (
    error: any,
    _q: express.Request,
    r: express.Response,
    _n: express.NextFunction,
  ) => {
    r.status(
      error.status === 404
        ? 404
        : error.type === "entity.too.large"
          ? 413
          : 500,
    ).json({
      error:
        error.status === 404
          ? "Resource not found."
          : "The request could not be completed.",
    });
  },
);
const port = Number(process.env.PORT || 4173);
app.listen(port, "127.0.0.1", () =>
  console.log(
    `Chinese Studio listening on 127.0.0.1:${port}; mode=${mode}; preview=${preview}`,
  ),
);
