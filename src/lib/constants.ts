export const CMU_COLLEGES = [
  "College of Engineering",
  "College of Fine Arts",
  "Dietrich College of Humanities and Social Sciences",
  "Heinz College of Information Systems and Public Policy",
  "Mellon College of Science",
  "School of Computer Science",
  "Tepper School of Business",
  "Other",
] as const;

export const PAY_LABELS: Record<string, string> = {
  HOURLY:  "Hourly",
  STIPEND: "Grant",
  UNPAID:  "Unpaid",
  CREDIT:  "Course Credit",
};

export const REMOTE_LABELS: Record<string, string> = {
  REMOTE:    "Remote",
  IN_PERSON: "In-person",
  HYBRID:    "Hybrid",
};

export const PAY_COLORS: Record<string, string> = {
  HOURLY:  "bg-green-50 text-green-700",
  STIPEND: "bg-emerald-50 text-emerald-700",
  UNPAID:  "bg-gray-50 text-gray-600",
  CREDIT:  "bg-yellow-50 text-yellow-700",
};

export const REMOTE_COLORS: Record<string, string> = {
  REMOTE:    "bg-blue-50 text-blue-700",
  IN_PERSON: "bg-purple-50 text-purple-700",
  HYBRID:    "bg-indigo-50 text-indigo-700",
};

export const DOC_REQ_LABELS: Record<string, string> = {
  UNAVAILABLE: "Not requested",
  OPTIONAL:    "Optional",
  REQUIRED:    "Required",
};
