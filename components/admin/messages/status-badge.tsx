import { Badge } from "@/components/ui/badge";
import { CONTACT_STATUS_LABELS, type ContactPriority, type ContactStatus } from "@/types";

type Tone = React.ComponentProps<typeof Badge>["tone"];

export const CONTACT_STATUS_TONE: Record<ContactStatus, Tone> = {
  new: "ember",
  read: "neutral",
  replied: "info",
  in_discussion: "amber",
  converted: "success",
  closed: "outline",
  spam: "crimson",
};

export const CONTACT_PRIORITY_LABELS: Record<ContactPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

const PRIORITY_TONE: Record<ContactPriority, Tone> = {
  low: "outline",
  normal: "neutral",
  high: "ember",
};

export function ContactStatusBadge({ status }: { status: ContactStatus }) {
  return (
    <Badge tone={CONTACT_STATUS_TONE[status]} mono>
      {CONTACT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ContactPriorityBadge({ priority }: { priority: ContactPriority }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} mono>
      {CONTACT_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
