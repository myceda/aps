import type { UserRole } from "@/lib/types";

const DEFAULT_STUDENT_DOMAINS = ["silpakorn.edu", "su.ac.th"];

export function getAllowedStudentDomains() {
  return (process.env.ALLOWED_STUDENT_DOMAINS ?? DEFAULT_STUDENT_DOMAINS.join(","))
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveRoleFromEmail(email: string): UserRole | null {
  const normalized = email.toLowerCase();
  if (getAdminEmails().includes(normalized)) return "admin";

  const domain = normalized.split("@").at(1);
  if (domain && getAllowedStudentDomains().includes(domain)) return "student";

  return null;
}

export function canAccessStudentRecord(actorEmail: string, ownerEmail: string, actorRole: UserRole) {
  return actorRole === "admin" || actorEmail.toLowerCase() === ownerEmail.toLowerCase();
}
