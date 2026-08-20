/**
 * US phone number handling (NANP).
 *
 * The lead form accepts US numbers only — a deliberate product decision. Note
 * the tradeoff: a share of this site's audience is international students who
 * have not arrived in the US yet and still carry a home-country number, and
 * this rule turns those leads away. To accept international numbers again,
 * relax `isValidUsPhone` and the matching `validate_phone` in
 * backend/leads/serializers.py — both sides must change together.
 */

/**
 * The 10 national digits, with any country code removed.
 *
 * The country code is stripped from the STRING before digits are extracted.
 * Extracting digits first is wrong: `formatUsPhone` emits a literal "+1 ("
 * prefix, so on the next keystroke that 1 would be read back as the first
 * digit of the number and shift everything along — typing 4155550142 one
 * character at a time produced "+1 (111) 111-1141".
 *
 * Stripping a leading 1 is always safe here: no US area code starts with 0
 * or 1, so a real national number can never begin with one.
 */
export function digitsOf(input: string): string {
  const withoutCountryCode = input.replace(/^\s*\+?\s*1[\s.-]*/, "");
  return withoutCountryCode.replace(/\D/g, "");
}

/**
 * True for a structurally valid US number.
 *
 * NANP rules, which catch most typos that a bare length check would not:
 *  - exactly 10 digits after the optional country code
 *  - area code starts 2–9 (no 0 or 1) and is not a service code like 911
 *  - exchange code starts 2–9
 */
export function isValidUsPhone(input: string): boolean {
  const digits = digitsOf(input);
  if (digits.length !== 10) return false;

  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);

  if (!/^[2-9]\d\d$/.test(area)) return false;
  if (area.endsWith("11")) return false; // 411, 911 and friends
  if (!/^[2-9]\d\d$/.test(exchange)) return false;

  return true;
}

/** Display form: +1 (555) 000-0000. Partial input formats as far as it can. */
export function formatUsPhone(input: string): string {
  const digits = digitsOf(input);
  if (digits.length === 0) return "";

  // More digits than a US number holds: hand back exactly what was typed.
  // Applying the mask here would silently drop the extra digits and turn
  // +91 98765 43210 into "+1 (919) 876-5432" — a valid-looking US number the
  // person never entered, which then passes validation. Leaving it alone lets
  // them see their real input and lets the validator reject it honestly.
  if (digits.length > 10) return input;

  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);
  const line = digits.slice(6, 10);

  if (digits.length <= 3) return `+1 (${area}`;
  if (digits.length <= 6) return `+1 (${area}) ${exchange}`;
  return `+1 (${area}) ${exchange}-${line}`;
}

/** Storage form: +1XXXXXXXXXX. Empty string for empty input. */
export function toE164(input: string): string {
  const digits = digitsOf(input);
  return digits.length === 10 ? `+1${digits}` : "";
}

export const US_PHONE_PLACEHOLDER = "+1 (555) 000-0000";
export const US_PHONE_ERROR = `Enter a US phone number, like ${US_PHONE_PLACEHOLDER}`;
