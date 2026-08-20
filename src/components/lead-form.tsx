"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, leadSchema, submitLead, type LeadInput } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { formatUsPhone, US_PHONE_PLACEHOLDER } from "@/lib/phone";

const authOptions = [
  { value: "f1", label: "F1 student" },
  { value: "opt", label: "Post-completion OPT" },
  { value: "stem-opt", label: "STEM OPT extension" },
  { value: "h1b", label: "H-1B" },
  { value: "gc", label: "Green card holder" },
  { value: "citizen", label: "US citizen" },
  { value: "other", label: "Other / not sure" },
] as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function LeadForm() {
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      target_roles: "",
      linkedin_url: "",
      message: "",
      website: "",
    },
  });

  const authValue = watch("work_authorization");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitLead(values);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        // Map server-side field errors back onto the form so they appear
        // beside the field that caused them, not in a banner.
        for (const [field, message] of Object.entries(error.fields)) {
          if (field in values) {
            setError(field as keyof LeadInput, { message });
          }
        }
        toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Email us and we'll pick it up there.");
    }
  });

  if (done) {
    return (
      <div className="rounded-lg border border-hairline bg-card p-8 shadow-card">
        <CheckCircle2 className="size-7 text-stage-done" aria-hidden />
        <h3 className="mt-4 text-h3 text-ink">We have your details</h3>
        <p className="mt-3 max-w-[48ch] text-muted-foreground">
          A confirmation is on its way to your inbox. Someone will reply within
          one business day to arrange your free demo call.
        </p>
        <p className="mt-4 text-sm text-dim">
          Nothing arrived? Check spam, or email{" "}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-primary underline underline-offset-4"
          >
            {siteConfig.contact.email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? "full_name-error" : undefined}
            {...register("full_name")}
          />
          <FieldError
            id="full_name-error"
            message={errors.full_name?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">
            Phone <span className="font-normal text-dim">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={US_PHONE_PLACEHOLDER}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone", {
              // Format as they type, so the US shape is obvious before they
              // ever hit submit rather than only in an error message.
              onChange: (e) => {
                e.target.value = formatUsPhone(e.target.value);
              },
            })}
          />
          <FieldError id="phone-error" message={errors.phone?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="work_authorization">Work authorisation</Label>
          <Select
            value={authValue}
            onValueChange={(v) =>
              setValue(
                "work_authorization",
                v as LeadInput["work_authorization"],
                {
                  shouldValidate: true,
                },
              )
            }
          >
            <SelectTrigger
              id="work_authorization"
              className="w-full"
              aria-invalid={!!errors.work_authorization}
            >
              <SelectValue placeholder="Select your status" />
            </SelectTrigger>
            <SelectContent>
              {authOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError
            id="work_authorization-error"
            message={errors.work_authorization?.message}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="target_roles">
            Target roles{" "}
            <span className="font-normal text-dim">(optional)</span>
          </Label>
          <Input
            id="target_roles"
            placeholder="Senior data engineer, platform engineer — Bay Area or remote"
            {...register("target_roles")}
          />
          <FieldError
            id="target_roles-error"
            message={errors.target_roles?.message}
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="linkedin_url">
            LinkedIn <span className="font-normal text-dim">(optional)</span>
          </Label>
          <Input
            id="linkedin_url"
            inputMode="url"
            placeholder="https://www.linkedin.com/in/…"
            aria-invalid={!!errors.linkedin_url}
            {...register("linkedin_url")}
          />
          <FieldError
            id="linkedin_url-error"
            message={errors.linkedin_url?.message}
          />
          <p className="text-sm text-dim">
            Send your resume by email once we reply — file uploads aren&apos;t
            switched on yet.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="message">
            Anything we should know?{" "}
            <span className="font-normal text-dim">(optional)</span>
          </Label>
          <Textarea id="message" rows={4} {...register("message")} />
          <FieldError id="message-error" message={errors.message?.message} />
        </div>
      </div>

      {/* Honeypot. Hidden from layout and from assistive tech; only a bot
          fills it, and the server rejects any submission that does. */}
      <div
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <Button type="submit" size="cta" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Sending
            </>
          ) : (
            <>
              Request my demo call
              <ArrowRight aria-hidden />
            </>
          )}
        </Button>
        <p className="text-sm text-dim">
          Free, and nothing is charged on this call.
        </p>
      </div>
    </form>
  );
}
