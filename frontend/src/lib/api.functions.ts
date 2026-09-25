import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  Balances,
  Chore,
  Expense,
  Household,
  HouseholdMember,
  SessionUser,
  SimplifiedDebt,
} from "./api.types";

const SESSION_COOKIE = "rr_session";
const USER_COOKIE = "rr_user";
const HOUSEHOLD_COOKIE = "rr_household";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { detail?: string | Array<{ msg?: string }> };
    if (typeof body.detail === "string") message = body.detail;
    if (Array.isArray(body.detail)) message = body.detail.map((item) => item.msg).filter(Boolean).join(", ") || message;
  } catch {
    // Keep the status-based message when the API does not return JSON.
  }
  throw new Error(message);
}

async function authHeaders() {
  const { getCookie } = await import("@tanstack/react-start/server");
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("AUTH_REQUIRED");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const raw = getCookie(USER_COOKIE);
  if (!raw || !getCookie(SESSION_COOKIE)) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
});

export const authenticate = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        mode: z.enum(["login", "register"]),
        email: z.string().email(),
        password: z.string().min(6),
        full_name: z.string().trim().min(1).max(255).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    const path = data.mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
    const payload = data.mode === "login"
      ? { email: data.email, password: data.password }
      : { email: data.email, password: data.password, full_name: data.full_name };
    const result = await parseResponse<SessionUser & { access_token: string }>(
      await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
    const { setCookie } = await import("@tanstack/react-start/server");
    const secure = process.env["NODE_ENV"] === "production";
    setCookie(SESSION_COOKIE, result.access_token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 7 });
    const user: SessionUser = {
      user_id: result.user_id,
      email: result.email,
      full_name: result.full_name,
      available_login_methods: result.available_login_methods ?? null,
    };
    setCookie(USER_COOKIE, JSON.stringify(user), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return user;
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(USER_COOKIE, { path: "/" });
  deleteCookie(HOUSEHOLD_COOKIE, { path: "/" });
  return { ok: true };
});

export const getHouseholdId = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  return getCookie(HOUSEHOLD_COOKIE) ?? null;
});

export const selectHousehold = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ household_id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    const household = await parseResponse<Household>(
      await fetch(`${base}/api/v1/households/${encodeURIComponent(data.household_id)}`, { headers: await authHeaders() }),
    );
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(HOUSEHOLD_COOKIE, household.id, { httpOnly: true, sameSite: "lax", secure: process.env["NODE_ENV"] === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return household;
  });

export const createHousehold = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ name: z.string().trim().min(1).max(255) }).parse(data))
  .handler(async ({ data }) => {
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    const household = await parseResponse<Household>(await fetch(`${base}/api/v1/households/`, { method: "POST", headers: await authHeaders(), body: JSON.stringify(data) }));
    const { setCookie } = await import("@tanstack/react-start/server");
    setCookie(HOUSEHOLD_COOKIE, household.id, { httpOnly: true, sameSite: "lax", secure: process.env["NODE_ENV"] === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return household;
  });

export const getHousehold = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const id = getCookie(HOUSEHOLD_COOKIE);
  if (!id) return null;
  const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
  return parseResponse<Household>(await fetch(`${base}/api/v1/households/${encodeURIComponent(id)}`, { headers: await authHeaders() }));
});

export const addHouseholdMember = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ user_id: z.string().min(1), turn_order_index: z.number().int().nullable().optional() }).parse(data))
  .handler(async ({ data }) => {
    const { getCookie } = await import("@tanstack/react-start/server");
    const id = getCookie(HOUSEHOLD_COOKIE);
    if (!id) throw new Error("Choose a household first");
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    return parseResponse<HouseholdMember>(await fetch(`${base}/api/v1/households/${encodeURIComponent(id)}/members`, { method: "POST", headers: await authHeaders(), body: JSON.stringify(data) }));
  });

export const getDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const id = getCookie(HOUSEHOLD_COOKIE);
  if (!id) return null;
  const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
  const headers = await authHeaders();
  const endpoints = [
    `/api/v1/households/${id}`,
    `/api/v1/chores/${id}`,
    `/api/v1/expenses/${id}/balances`,
    `/api/v1/expenses/${id}/simplify`,
    `/api/v1/expenses/${id}/history`,
    `/api/v1/expenses/${id}/stack`,
  ];
  const [householdResponse, choresResponse, balancesResponse, debtsResponse, expensesResponse] = await Promise.all([
    fetch(`${base}${endpoints[0]}`, { headers }),
    fetch(`${base}${endpoints[1]}`, { headers }),
    fetch(`${base}${endpoints[2]}`, { headers }),
    fetch(`${base}${endpoints[3]}`, { headers }),
    fetch(`${base}${endpoints[4]}`, { headers }),
  ]);
  const [household, chores, balances, debts, expenses] = await Promise.all([
    parseResponse<Household>(householdResponse), parseResponse<Chore[]>(choresResponse), parseResponse<Balances>(balancesResponse),
    parseResponse<SimplifiedDebt>(debtsResponse), parseResponse<Expense[]>(expensesResponse),
  ]);
  return { household, chores, balances, debts, expenses };
});

export const createChore = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ title: z.string().trim().min(1).max(255), description: z.string().optional(), initial_assignee_id: z.string().nullable().optional() }).parse(data))
  .handler(async ({ data }) => {
    const { getCookie } = await import("@tanstack/react-start/server");
    const household_id = getCookie(HOUSEHOLD_COOKIE);
    if (!household_id) throw new Error("Choose a household first");
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    return parseResponse<Chore>(await fetch(`${base}/api/v1/chores/`, { method: "POST", headers: await authHeaders(), body: JSON.stringify({ ...data, household_id }) }));
  });

export const rotateChore = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ chore_id: z.string(), completed: z.boolean(), skip_turn: z.boolean(), notes: z.string().optional() }).parse(data))
  .handler(async ({ data }) => {
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    const { chore_id, ...body } = data;
    return parseResponse<{ sarcastic_alert?: string | null }>(await fetch(`${base}/api/v1/chores/${encodeURIComponent(chore_id)}/rotate`, { method: "POST", headers: await authHeaders(), body: JSON.stringify(body) }));
  });

export const createExpense = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ payer_id: z.string().min(1), amount: z.number().positive(), description: z.string().trim().min(1).max(255), splits: z.array(z.object({ user_id: z.string(), split_amount: z.number().positive() })).min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { getCookie } = await import("@tanstack/react-start/server");
    const household_id = getCookie(HOUSEHOLD_COOKIE);
    if (!household_id) throw new Error("Choose a household first");
    const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
    return parseResponse<Expense>(await fetch(`${base}/api/v1/expenses/`, { method: "POST", headers: await authHeaders(), body: JSON.stringify({ ...data, household_id }) }));
  });

export const undoLastActivity = createServerFn({ method: "POST" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const id = getCookie(HOUSEHOLD_COOKIE);
  if (!id) throw new Error("Choose a household first");
  const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
  return parseResponse<{ success: boolean; message: string; sarcastic_alert?: string | null }>(await fetch(`${base}/api/v1/expenses/${encodeURIComponent(id)}/undo`, { method: "POST", headers: await authHeaders() }));
});

export const getAuthMethods = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const raw = getCookie(USER_COOKIE);
  if (!raw) throw new Error("AUTH_REQUIRED");
  const user = JSON.parse(raw) as SessionUser;
  const base = process.env["API_BASE_URL"] ?? "http://localhost:8000";
  return parseResponse<SessionUser & { has_password: boolean; has_ed25519: boolean; has_google_auth: boolean; ed25519_public_key?: string | null }>(await fetch(`${base}/api/v1/auth/methods/${encodeURIComponent(user.user_id)}`, { headers: await authHeaders() }));
});