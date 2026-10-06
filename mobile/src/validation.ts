const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+91)?\d{10}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return PHONE_RE.test(normalizePhone(phone));
}

export function emailError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email like name@example.com.";
  return null;
}

export function phoneError(phone: string, required: boolean): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return required ? "Phone is required." : null;
  if (!PHONE_RE.test(normalizePhone(trimmed))) {
    return "Enter a 10-digit mobile number (optionally with +91).";
  }
  return null;
}
