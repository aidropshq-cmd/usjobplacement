import { z } from "zod";

/**
 * The boundary between Next.js and the Django API.
 *
 * Every response is validated with Zod rather than trusted, so a changed
 * serializer surfaces as a caught error instead of a blank section on a live
 * page. This is the reason the project is TypeScript-only.
 */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

/** Must stay in sync with WorkAuthorization in backend/leads/models.py. */
export const workAuthValues = [
  "f1",
  "opt",
  "stem-opt",
  "h1b",
  "gc",
  "citizen",
  "other",
] as const;

export const leadSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120, "That name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email so we can reply")
    .email("Enter an email in the form name@example.com"),
  phone: z.string().trim().max(32, "That phone number is too long").optional(),
  work_authorization: z.enum(workAuthValues, {
    message: "Select your work authorisation",
  }),
  target_roles: z.string().trim().max(500, "Keep this under 500 characters"),
  linkedin_url: z
    .union([
      z.string().trim().length(0),
      z.string().trim().url("Enter a full URL, starting with https://"),
    ])
    .optional(),
  message: z.string().trim().max(4000, "Keep this under 4000 characters"),
  /** Honeypot. A real browser never fills a field hidden from layout. */
  website: z.string().max(0).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

const leadResponseSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .email("Enter a valid email"),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least a sentence")
    .max(4000, "Keep this under 4000 characters"),
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Thrown for anything the user could act on. `fields` maps to form errors. */
export class ApiError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
  }
}

async function post(path: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "We couldn't reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 429) {
    throw new ApiError(
      "That's a few too many submissions in a row. Try again in an hour, or email us directly.",
    );
  }

  if (!response.ok) {
    let fields: Record<string, string> = {};
    try {
      const body = (await response.json()) as Record<string, unknown>;
      fields = Object.fromEntries(
        Object.entries(body).map(([key, value]) => [
          key,
          Array.isArray(value) ? String(value[0]) : String(value),
        ]),
      );
    } catch {
      // Non-JSON error body — fall through to the generic message.
    }

    if (Object.keys(fields).length > 0) {
      throw new ApiError("Please fix the highlighted fields.", fields);
    }
    throw new ApiError(
      "Something went wrong on our side. Try again, or email us directly.",
    );
  }

  return response.json();
}

export async function submitLead(input: LeadInput) {
  const data = await post("/api/leads/", {
    ...input,
    source_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  return leadResponseSchema.parse(data);
}

export async function submitContact(input: ContactInput) {
  return post("/api/contact/", input);
}
