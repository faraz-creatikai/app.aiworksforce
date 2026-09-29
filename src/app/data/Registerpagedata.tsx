import { loginLeftPanel } from "@/app/data/Loginpagedata";

/**
 * The register page reuses the SAME left panel content as the login page.
 * To change which content set is used, edit the import at the top of
 * LoginPageData.tsx — that is the only switch point.
 *
 * Only the right-side form copy lives here.
 */
export const registerLeftPanel = {
  heading: loginLeftPanel.heading,
  description: loginLeftPanel.description,
  features: loginLeftPanel.features,
  highlightCard: loginLeftPanel.highlightCard,
  // change this line only if you want a different illustration on register
  illustration: loginLeftPanel.illustration,
};

export interface RegisterFormContent {
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  submitLabel: string;
  submitLoadingLabel: string;
  dividerLabel: string;
  loginPrompt: string;
  loginLabel: string;
  loginHref: string;
  securityNote: string;
  brandName: string;
  copyrightSuffix: string;
}

export const registerFormContent: RegisterFormContent = {
  title: "Register Account",
  subtitle: "Create your account to get started.",
  nameLabel: "Full Name",
  namePlaceholder: "John Doe",
  emailLabel: "Email Address",
  emailPlaceholder: "admin@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "••••••••••",
  phoneLabel: "Phone Number",
  phonePlaceholder: "+91 98765 43210",
  submitLabel: "Register",
  submitLoadingLabel: "Registering...",
  dividerLabel: "or",
  loginPrompt: "Already have an account?",
  loginLabel: "Login",
  loginHref: "/admin",
  securityNote: "Your data is protected with enterprise-grade security.",
  brandName: "Consultancy CRM",
  copyrightSuffix: "All rights reserved.",
};

export default registerFormContent;