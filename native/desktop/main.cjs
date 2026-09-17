const {
  app,
  BrowserWindow,
  protocol,
  net,
  shell,
  session,
  dialog,
  systemPreferences,
} = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { resolveResource } = require("./paths.cjs");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "studio",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);
// Preserve existing installations’ local progress across the ESC display-name change.
app.setPath(
  "userData",
  process.env.STUDIO_TEST_DATA ||
    path.join(app.getPath("appData"), "Chinese Studio"),
);
const local = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "studio:" && u.hostname === "app";
  } catch {
    return false;
  }
};
function external(url) {
  try {
    if (new URL(url).protocol === "https:") void shell.openExternal(url);
  } catch {}
}
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      window.restore();
      window.focus();
    }
  });
  app.whenReady().then(() => {
    const root = app.isPackaged
      ? path.join(process.resourcesPath, "web")
      : path.resolve(__dirname, "../../build/client");
    protocol.handle("studio", async (request) => {
      try {
        if (request.method !== "GET" && request.method !== "HEAD")
          return new Response("", { status: 405 });
        const file = resolveResource(root, request.url);
        if (!file)
          return new Response(
            JSON.stringify({
              error:
                "Online services are available at https://chinese.ztvmm.live",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        return await net.fetch(pathToFileURL(file).href, {
          method: request.method,
          headers: request.headers,
        });
      } catch {
        return new Response("Resource unavailable", { status: 404 });
      }
    });
    const csp =
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'";
    session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [csp],
          "X-Content-Type-Options": ["nosniff"],
        },
      }),
    );
    session.defaultSession.setPermissionCheckHandler(
      (contents, permission, origin) =>
        permission === "media" &&
        !!contents &&
        local(contents.getURL()) &&
        local(origin),
    );
    session.defaultSession.setPermissionRequestHandler(
      async (contents, permission, callback, details) => {
        if (
          permission !== "media" ||
          !local(contents.getURL()) ||
          !local(details.requestingUrl) ||
          !details.mediaTypes?.length ||
          details.mediaTypes.some((t) => t !== "audio")
        )
          return callback(false);
        const answer = await dialog.showMessageBox(window, {
          type: "question",
          buttons: ["Allow microphone", "Cancel"],
          defaultId: 1,
          cancelId: 1,
          message: "Record your pronunciation?",
          detail:
            "Recordings stay on this device unless you choose to export them.",
        });
        const allowed =
          answer.response === 0 &&
          (process.platform !== "darwin" ||
            (await systemPreferences.askForMediaAccess("microphone")));
        callback(allowed);
      },
    );
    function createWindow() {
      window = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 360,
        minHeight: 480,
        title: "ESC Chinese",
        backgroundColor: "#102b50",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          spellcheck: false,
        },
      });
      window.webContents.setWindowOpenHandler(({ url }) => {
        if (local(url) || url.startsWith("blob:studio://app/"))
          window.webContents.downloadURL(url);
        else external(url);
        return { action: "deny" };
      });
      window.webContents.on("will-navigate", (event, url) => {
        if (!local(url)) {
          event.preventDefault();
          external(url);
        }
      });
      window.webContents.on("will-attach-webview", (event) =>
        event.preventDefault(),
      );
      window.loadURL("studio://app/learn");
      window.on("closed", () => {
        window = null;
      });
    }
    createWindow();
    app.on("activate", () => {
      if (!window) createWindow();
    });
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
