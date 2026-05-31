// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })),
}));

import type { NextRequest } from "next/server";
import { createSession, getSession, deleteSession, verifySession } from "../auth";

const TEST_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets an auth-token cookie", async () => {
    await createSession("user-123", "test@example.com");
    expect(mockSet.mock.calls[0][0]).toBe("auth-token");
  });

  it("sets a JWT with three dot-separated parts", async () => {
    await createSession("user-123", "test@example.com");
    const token = mockSet.mock.calls[0][1];
    expect(token.split(".")).toHaveLength(3);
  });

  it("sets httpOnly, sameSite lax, and path /", async () => {
    await createSession("user-123", "test@example.com");
    const options = mockSet.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("sets cookie expiry approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-123", "test@example.com");
    const after = Date.now();
    const expiresMs = mockSet.mock.calls[0][2].expires.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
  });
});

describe("getSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no cookie is present", async () => {
    mockGet.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  it("returns null for an invalid token", async () => {
    mockGet.mockReturnValue({ value: "not.a.valid.jwt" });
    expect(await getSession()).toBeNull();
  });

  it("returns the session payload for a valid token", async () => {
    const token = await new SignJWT({ userId: "user-123", email: "test@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(TEST_SECRET);

    mockGet.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session?.userId).toBe("user-123");
    expect(session?.email).toBe("test@example.com");
  });

  it("returns null for an expired token", async () => {
    const token = await new SignJWT({ userId: "user-123", email: "test@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(0)
      .sign(TEST_SECRET);

    mockGet.mockReturnValue({ value: token });
    expect(await getSession()).toBeNull();
  });
});

describe("deleteSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledWith("auth-token");
  });

  it("deletes exactly one cookie", async () => {
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledOnce();
  });
});

describe("verifySession", () => {
  const makeRequest = (cookieValue?: string) =>
    ({ cookies: { get: () => (cookieValue ? { value: cookieValue } : undefined) } } as unknown as NextRequest);

  it("returns null when no cookie is present", async () => {
    expect(await verifySession(makeRequest())).toBeNull();
  });

  it("returns null for an invalid token", async () => {
    expect(await verifySession(makeRequest("not.a.valid.jwt"))).toBeNull();
  });

  it("returns the session payload for a valid token", async () => {
    const token = await new SignJWT({ userId: "user-123", email: "test@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(TEST_SECRET);

    const session = await verifySession(makeRequest(token));
    expect(session?.userId).toBe("user-123");
    expect(session?.email).toBe("test@example.com");
  });

  it("returns null for an expired token", async () => {
    const token = await new SignJWT({ userId: "user-123", email: "test@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(0)
      .sign(TEST_SECRET);

    expect(await verifySession(makeRequest(token))).toBeNull();
  });
});
