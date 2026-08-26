"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError,
  contactSchema,
  submitContact,
  type ContactInput,
} from "@/lib/api";

export function ContactForm() {
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "", website: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitContact(values);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fields)) {
          if (field in values) {
            setError(field as keyof ContactInput, { message });
          }
        }
        toast.error(error.message);
        return;
      }
      toast.error("Something went wrong. Try emailing us instead.");
    }
  });

  if (done) {
    return (
      <div className="rounded-lg border border-hairline bg-card p-8 shadow-raised">
        <CheckCircle2 className="size-7 text-stage-done" aria-hidden />
        <h2 className="mt-4 text-h3 text-ink">Message sent</h2>
        <p className="mt-3 text-muted-foreground">
          We read everything that comes in and reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-lg border border-hairline bg-card p-6 shadow-raised sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            rows={5}
            aria-invalid={!!errors.message}
            {...register("message")}
          />
          {errors.message ? (
            <p className="text-sm text-destructive">{errors.message.message}</p>
          ) : null}
        </div>
      </div>

      {/* Honeypot — hidden from layout and assistive tech. */}
      <div
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <Button type="submit" size="cta" className="mt-7" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Sending
          </>
        ) : (
          <>
            <Send aria-hidden />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
