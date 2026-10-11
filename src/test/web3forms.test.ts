import { afterEach, describe, expect, it, vi } from "vitest";

import { sendWithdrawalAlert } from "@/lib/web3forms";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("withdrawal Web3Forms alerts", () => {
  it("submits withdrawal details from the browser using the public access key", async () => {
    vi.stubEnv("VITE_WEB3FORMS_ACCESS_KEY", "test-access-key");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const warning = await sendWithdrawalAlert({
      username: "alice",
      amount: 2000,
      id: "withdrawal-123",
      method: "Orange Money",
      number: "+237670000001",
    });

    expect(warning).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(String(options?.body)) as Record<string, string>;
    expect(body["access_key"]).toBe("test-access-key");
    expect(body["name"]).toBe("@alice");
    expect(body["message"]).toContain("Amount: 2000 EUR");
    expect(body["message"]).toContain("Payment method: Orange Money");
    expect(body["message"]).toContain("Mobile Money number: +237670000001");
    expect(body["message"]).toContain("Withdrawal ID: withdrawal-123");
  });

  it("reports rejection while leaving the withdrawal saved", async () => {
    vi.stubEnv("VITE_WEB3FORMS_ACCESS_KEY", "test-access-key");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "Domain not allowed" }), {
        status: 403,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const warning = await sendWithdrawalAlert({
      username: "alice",
      amount: 2000,
      id: "withdrawal-123",
      method: "Orange Money",
      number: "+237670000001",
    });

    expect(warning).toBe("The withdrawal was saved, but its email alert could not be sent.");
    expect(console.error).toHaveBeenCalledWith(
      "Web3Forms rejected the withdrawal email alert.",
      expect.objectContaining({ status: 403 }),
    );
  });

  it("reports a missing access key without making a network request", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const warning = await sendWithdrawalAlert({
      username: "alice",
      amount: 2000,
      id: "withdrawal-123",
      method: "Orange Money",
      number: "+237670000001",
    });

    expect(warning).toBe("The withdrawal was saved, but its email alert could not be sent.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
