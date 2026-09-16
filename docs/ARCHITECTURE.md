# Architecture

React + TypeScript + Vite render the same application for every device. Public course JSON and assets are bundled locally. There are no runtime font/CDN dependencies. Handwriting loads in a separate JavaScript chunk, with 333 stroke guides bundled from hanzi-writer-data.

A versioned service worker caches the app shell, course JSON and all JavaScript chunks atomically. Course files are cached on use or in a resumable full-pack download. Offline PDFs support range responses. The worker never caches `/api` or `/auth`, and older full packs stay until a learner removes them; downloaded course content is public. Updates activate when the previous app tabs close; reopen the app and download the updated pack when course resources change.

Progress is local-first, validated with a shared Zod schema, and written to browser storage on each React state update. Export/import works without a server. Account backups are explicit copies; no automatic merge or conflict resolution is claimed. Restoring an account backup requires a confirmation showing its learned words and XP. Keep an export before replacing progress.

The optional Express service binds localhost behind an HTTPS reverse proxy. Google OIDC uses PKCE, state, nonce and verified identity claims; session cookies are HttpOnly, SameSite=Lax and Secure in production. Session tokens are hashed in SQLite. Write endpoints check Origin, progress payloads are bounded and validated, and AI is authenticated and rate limited. `ACCESS_MODE=mfu` restricts **account services** by Google's verified hosted domain; public lesson files remain public by design. Restricting already published content requires a different deployment and cannot revoke downloaded copies.

SQLite holds account identity, session records, explicitly saved progress and daily tutor usage counts. Microphone audio never uploads. DeepSeek sees the learner's chat and selected course context only when asked. API credentials remain in the server environment. Cloud services cannot run offline; all core learning tools can.
