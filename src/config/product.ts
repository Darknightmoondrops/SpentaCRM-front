export const productConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "SpentaCRM",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Spenta",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Modular B2B CRM platform",
  workspaceName: process.env.NEXT_PUBLIC_WORKSPACE_NAME || "Demo Workspace",
  workspacePlan: process.env.NEXT_PUBLIC_WORKSPACE_PLAN || "Business",
  locale: process.env.NEXT_PUBLIC_LOCALE || "en-GB",
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "EUR",
  timezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || "Europe/Berlin",
  version: process.env.NEXT_PUBLIC_APP_VERSION || "v0.13.2",
  demoUser: {
    name: process.env.NEXT_PUBLIC_DEMO_USER_NAME || "Alex Morgan",
    email: process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || "alex@example.com",
    initials: process.env.NEXT_PUBLIC_DEMO_USER_INITIALS || "AM",
    role: process.env.NEXT_PUBLIC_DEMO_USER_ROLE || "Administrator",
  },
} as const;
