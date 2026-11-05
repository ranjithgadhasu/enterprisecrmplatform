export const PHOTOS = {
  maya: "https://images.pexels.com/photos/27086916/pexels-photo-27086916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  priya: "https://images.pexels.com/photos/29811345/pexels-photo-29811345.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  amara: "https://images.pexels.com/photos/38197025/pexels-photo-38197025.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  jordan: "https://images.pexels.com/photos/12311579/pexels-photo-12311579.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  leo: "https://images.pexels.com/photos/37218483/pexels-photo-37218483.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  theo: "https://images.pexels.com/photos/30496625/pexels-photo-30496625.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=240&w=240",
  office: "https://images.pexels.com/photos/12934597/pexels-photo-12934597.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
};

export const TEAM = [
  { id: "maya", name: "Maya Chen", role: "VP of Sales", email: "maya@northline.io", phone: "+1 (415) 555-0148", photo: PHOTOS.maya },
  { id: "jordan", name: "Jordan Ellis", role: "Account Executive", email: "jordan@northline.io", phone: "+1 (212) 555-0174", photo: PHOTOS.jordan },
  { id: "priya", name: "Priya Nair", role: "SDR", email: "priya@northline.io", phone: "+1 (312) 555-0190", photo: PHOTOS.priya },
  { id: "leo", name: "Leo Okonkwo", role: "Customer Success", email: "leo@northline.io", phone: "+1 (404) 555-0116", photo: PHOTOS.leo },
  { id: "amara", name: "Amara Singh", role: "Sales Manager", email: "amara@northline.io", phone: "+1 (617) 555-0162", photo: PHOTOS.amara },
  { id: "theo", name: "Theo Park", role: "Account Executive", email: "theo@northline.io", phone: "+1 (206) 555-0188", photo: PHOTOS.theo },
];

export const STAGES = [
  { id: "discovery", label: "Discovery", probability: 20, color: "#8d8478" },
  { id: "proposal", label: "Proposal", probability: 45, color: "#a8843d" },
  { id: "negotiation", label: "Negotiation", probability: 65, color: "#c6532a" },
  { id: "verbal", label: "Verbal", probability: 85, color: "#1d6848" },
  { id: "closed-won", label: "Closed won", probability: 100, color: "#1c1712" },
  { id: "closed-lost", label: "Closed lost", probability: 0, color: "#8f3148" },
];

export const OPEN_STAGES = ["discovery", "proposal", "negotiation", "verbal"];

export const LEAD_STATUSES = [
  { id: "new", label: "New", tone: "copper" },
  { id: "contacted", label: "Contacted", tone: "gold" },
  { id: "qualified", label: "Qualified", tone: "forest" },
  { id: "nurture", label: "Nurture", tone: "moss" },
  { id: "unqualified", label: "Unqualified", tone: "muted" },
  { id: "converted", label: "Converted", tone: "ink" },
];

export const SOURCES = ["Inbound", "Website", "Outbound", "Referral", "Partner", "Event", "LinkedIn"];

export const SOURCE_COLORS = {
  Inbound: "#c6532a",
  Website: "#1d6848",
  Outbound: "#3d5a80",
  Referral: "#a8843d",
  Partner: "#5f7d64",
  Event: "#8f3148",
  LinkedIn: "#1c1712",
};

export const INDUSTRIES = [
  "Financial services",
  "Healthcare",
  "Logistics",
  "Retail",
  "Legal",
  "Manufacturing",
  "Hospitality",
  "Climate",
  "Media",
  "Professional services",
  "Software",
];

export const PLANS = ["Starter", "Growth", "Enterprise", "Custom"];
export const HEALTH = ["thriving", "steady", "watch", "at-risk"];
export const CUSTOMER_STATUSES = ["active", "onboarding", "churned"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];
export const TASK_TYPES = ["Call", "Email", "Meeting", "Follow-up", "Proposal", "Onboarding", "Renewal"];
export const TASK_STATUSES = ["open", "in-progress", "done"];
export const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "deal", "task"];
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
export const TIMEZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
];
export const FISCAL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_TARGETS = [
  140000, 150000, 155000, 170000, 185000, 175000, 200000, 195000, 220000, 210000, 215000, 240000,
];

export function labelOf(list, id, fallback = "—") {
  return list.find((item) => item.id === id)?.label || id || fallback;
}

export function stageOf(id) {
  return STAGES.find((stage) => stage.id === id) || STAGES[0];
}
