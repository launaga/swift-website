// ARSO API — HTTP transport shell (08_API_Spec.yaml). Maps the REST contract to
// the service layer. Kept framework-free (node:http) — at this size (06 §6.1) a
// router is all that's warranted; Fastify/Nest would be more moving parts than
// work. Auth/RBAC middleware (06 §6.5) plugs in at `authorize()`.
import http from "node:http";
import pg from "pg";
import {
  createEstimate, issueQuote, createBooking, issueInvoice, createAssignment, ApiError,
} from "./services.ts";
import type { RuleSet } from "../../pricing-engine/src/types.ts";

export interface Deps { pool: pg.Pool; ruleset: RuleSet; ruleVersionId: string; }

type Handler = (body: any, deps: Deps) => Promise<{ status: number; body: unknown }>;

// route table mirrors the OpenAPI operationIds
const ROUTES: Record<string, Handler> = {
  "POST /estimates": async (b, d) => ({ status: 200, body: createEstimate(b.input, d.ruleset) }),
  "POST /quotes": async (b, d) => ({
    status: 201,
    body: await issueQuote((s, p) => d.pool.query(s, p), {
      input: b.input, ruleset: d.ruleset, ruleVersionId: d.ruleVersionId,
      tier: b.tier, costFloorIdr: b.costFloorIdr ?? null, createdBy: b.createdBy ?? null,
    }),
  }),
  "POST /bookings": async (b, d) => ({ status: 201, body: await createBooking((s, p) => d.pool.query(s, p), b) }),
  "POST /invoices": async (b, d) => ({ status: 201, body: await issueInvoice((s, p) => d.pool.query(s, p), b) }),
  "POST /assignments": async (b, d) => ({ status: 201, body: await createAssignment((s, p) => d.pool.query(s, p), b) }),
};

export function createServer(deps: Deps): http.Server {
  return http.createServer(async (req, res) => {
    const key = `${req.method} ${(req.url || "").split("?")[0]}`;
    const handler = ROUTES[key];
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (!handler) return send(404, { code: "NOT_FOUND", message: key });
    try {
      // authorize(req, key)  ← RBAC gate goes here (06 §6.5)
      const body = await readJson(req);
      const out = await handler(body, deps);
      send(out.status, out.body);
    } catch (e) {
      if (e instanceof ApiError) return send(e.httpStatus, { code: e.code, message: e.message });
      send(500, { code: "INTERNAL", message: (e as Error).message });
    }
  });
}

function readJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
