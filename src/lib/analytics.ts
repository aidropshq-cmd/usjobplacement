/**
 * Analytics events.
 *
 * There is no analytics provider installed yet, so this is a thin, dependency
 * free layer: events are pushed to `window.dataLayer`, which GA4, GTM and
 * most others read natively. Wiring a provider later means adding its script
 * — not touching a single call site.
 *
 * Until a provider exists nothing leaves the browser. That is deliberate: an
 * event layer that silently does nothing is honest; one that pretends to
 * report is not.
 */

export type AnalyticsEvent =
  | "hero_readiness_clicked"
  | "hero_demo_clicked"
  | "whatsapp_clicked"
  | "assessment_started"
  | "assessment_step_completed"
  | "resume_uploaded"
  | "assessment_completed"
  | "score_viewed"
  | "lead_form_started"
  | "lead_form_submitted"
  | "job_viewed"
  | "job_saved"
  | "application_started"
  | "consultation_clicked"
  | "mock_interview_started";

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: AnalyticsEvent, payload: Payload = {}): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload });

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, payload);
  }
}
