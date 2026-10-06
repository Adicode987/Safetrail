export type AlertRecipient = { name: string; email: string };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function simulateSend(
  contacts: Array<{ name: string; email: string }>,
  message: string
): { recipients: AlertRecipient[]; status: "SENT" | "FAILED" } {
  const recipients: AlertRecipient[] = contacts.map((c) => ({
    name: c.name,
    email: c.email,
  }));

  if (contacts.length === 0) {
    return { recipients: [], status: "FAILED" };
  }

  let anySent = false;
  for (const contact of contacts) {
    if (isValidEmail(contact.email)) {
      console.log(
        `[SIMULATED] Sending alert to ${contact.name} <${contact.email}>:`
      );
      console.log(`  ${message.split("\n")[0]}`);
      anySent = true;
    } else {
      console.log(
        `[SIMULATED] FAILED for ${contact.name} <${contact.email}>: invalid email`
      );
    }
  }

  return { recipients, status: anySent ? "SENT" : "FAILED" };
}
