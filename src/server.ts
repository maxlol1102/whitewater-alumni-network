import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Netlify Functions v2 config — static assets in publish dir take precedence.
export const config = { path: "/*" };

async function handler(request: Request, context: unknown): Promise<Response> {
  try {
    const entry = await getServerEntry();
    const response = await entry.fetch(request, undefined, context);
    return await normalizeCatastrophicSsrResponse(response);
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
    return new Response(
      renderErrorPage() + `\n<!-- DEBUG: ${msg.replace(/-->/g, "-->")} -->`,
      { status: 500, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
}

// TanStack Start dev server calls module.default.fetch(request).
// Netlify Functions v2 calls module.default(request, context).
// Attaching .fetch to the function satisfies both conventions.
export default Object.assign(handler, { fetch: handler });
