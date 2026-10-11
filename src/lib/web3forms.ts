const WITHDRAWAL_ALERT_ERROR = "The withdrawal was saved, but its email alert could not be sent.";

export async function sendWithdrawalAlert(withdrawal: {
  username: string;
  amount: number;
  id: string;
  method: string;
  number: string;
}): Promise<string | null> {
  const accessKey = import.meta.env["VITE_WEB3FORMS_ACCESS_KEY"];
  if (!accessKey) {
    console.error("Withdrawal email alert not sent: VITE_WEB3FORMS_ACCESS_KEY is not configured.");
    return WITHDRAWAL_ALERT_ERROR;
  }

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "New withdrawal request — PayPoint",
        from_name: "PayPoint",
        name: `@${withdrawal.username}`,
        message: [
          `User: @${withdrawal.username}`,
          `Amount: ${withdrawal.amount} EUR`,
          `Payment method: ${withdrawal.method}`,
          `Mobile Money number: ${withdrawal.number}`,
          `Withdrawal ID: ${withdrawal.id}`,
          "Note: This is a demo withdrawal request; no real payment was sent.",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const result: unknown = await response.json();
    if (
      !response.ok ||
      !result ||
      typeof result !== "object" ||
      !("success" in result) ||
      result.success !== true
    ) {
      console.error("Web3Forms rejected the withdrawal email alert.", {
        status: response.status,
        result,
      });
      return WITHDRAWAL_ALERT_ERROR;
    }
    return null;
  } catch (error) {
    console.error("Failed to send the withdrawal email alert through Web3Forms.", error);
    return WITHDRAWAL_ALERT_ERROR;
  }
}
