import { contactEmail } from "@/lib/legal";

export function ContactLine() {
  const email = contactEmail();
  return email ? (
    <a href={`mailto:${email}`}>{email}</a>
  ) : (
    <span>the contact address we will post on this page</span>
  );
}
