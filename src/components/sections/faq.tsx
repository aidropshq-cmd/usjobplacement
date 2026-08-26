import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Answers are written to be accurate about what this service actually does.
 * Nothing here promises employment, sponsorship, or legal guidance.
 */
export const faqs = [
  {
    q: "Do you guarantee a job?",
    a: "No. Nobody can, and anyone who says otherwise is selling you something. Hiring decisions belong to employers. What we commit to is the work: a rewritten resume, a focused target list, applications you can audit, interview preparation before every round, and support through the offer.",
  },
  {
    q: "Do you work with OPT and STEM OPT candidates?",
    a: "Yes. We plan the search backwards from your authorisation dates rather than forwards from today, and we prioritise employers with a recent filing history. We are not immigration attorneys and give no legal advice — confirm your own dates and eligibility with your DSO or a licensed attorney.",
  },
  {
    q: "Do you support H-1B professionals?",
    a: "Yes, including transfers. Whether you are cap-subject or already counted changes the strategy and when you can start, so that is one of the first things we establish. Again: search strategy, not legal advice.",
  },
  {
    q: "Do you guarantee interview calls?",
    a: "No. We can make your application stronger and better targeted, and that is what moves the odds — but whether a recruiter calls is their decision, not ours. Any service promising a number of interviews is promising something it does not control.",
  },
  {
    q: "Do you apply to jobs for candidates?",
    a: "We prepare and submit targeted applications matched to your profile and work authorisation, and every one is logged with the date, role, company and outcome so you can see exactly where your search stands. We do not mass-apply, and we do not misrepresent your experience anywhere.",
  },
  {
    q: "Do you charge a percentage of my salary?",
    a: "No. There is no salary commission and no recurring consultancy retainer. It is one flat engagement fee, agreed in writing before any work starts, and nothing is tied to whether you accept an offer.",
  },
  {
    q: "Can I use this if I am already applying on my own?",
    a: "Yes, and most people are. We usually start by looking at what is already happening — where applications are stalling, which rounds you are not converting — and fix that rather than starting from zero.",
  },
  {
    q: "Do you attend interviews on our behalf?",
    a: "Never. We run mock interviews and coaching before each round and debrief with you afterwards. Anyone offering to sit on a live interview is offering fraud: it voids offers, gets candidates blacklisted by employers and background-check vendors, and puts your status at risk.",
  },
  {
    q: "Do you provide visa sponsorship or immigration advice?",
    a: "No, to both. Sponsorship comes only from an employer willing and eligible to sponsor — it is never something we can provide or arrange. And we are not immigration attorneys: nothing on this site is legal advice. For anything about your status, eligibility or filings, speak to your DSO or a licensed immigration attorney.",
  },
];

export function Faq() {
  return (
    <Accordion type="single" collapsible className="max-w-3xl">
      {faqs.map((item) => (
        <AccordionItem key={item.q} value={item.q}>
          <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
          <AccordionContent className="max-w-[68ch] text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
