import {
  FaUsers,
  FaBriefcase,
  FaChartBar,
  FaShieldAlt,
  FaRocket,
  FaChartLine,
  FaTrophy,
  FaLightbulb,
  FaEnvelopeOpenText,
  FaBrain,
  FaUserCheck,
  FaRobot,
  FaBolt,
  FaFunnelDollar,
  FaUserClock,
  FaCalendarCheck,
  FaMobileAlt,
  FaFingerprint,
} from "react-icons/fa";
import type { IconType } from "react-icons";

export interface LoginFeature {
  icon: IconType;
  title: string;
  description: string;
}

export interface LoginStat {
  icon: IconType;
  value: string;
  label: string;
}

export interface LoginPageContent {
  illustration: string;
  heading: {
    lineOne: string;
    lineTwo: string;
    highlight: string; // rendered in primary color right after lineTwo
  };
  description: string;
  features: LoginFeature[];
  highlightCard: {
    icon: IconType;
    title: string;
    description: string;
    stats: LoginStat[];
  };
  form: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberLabel: string;
    forgotLabel: string;
    forgotHref: string;
    submitLabel: string;
    submitLoadingLabel: string;
    dividerLabel: string;
    registerPrompt: string;
    registerLabel: string;
    registerHref: string;
    securityNote: string;
    brandName: string;
    copyrightSuffix: string;
  };
}

export const loginPageContent: LoginPageContent = {
  illustration: "/bglogo.png",

  heading: {
    lineOne: "Smart Operations.",
    lineTwo: "Empowered ",
    highlight: "Teams.",
  },

  description:
    "Your intelligent employee portal. Seamlessly log attendance, submit time-off requests, and access your weekly insights all in one unified, AI-driven workspace.",

  features: [
    {
      icon: FaUserClock,
      title: "AI-Powered Attendance",
      description:
        "Clock in and out seamlessly with real-time tracking, intelligent shift logging, and automated hours calculation.",
    },
    {
      icon: FaCalendarCheck,
      title: "Smart Leave Management",
      description:
        "Submit and track your WFH or time-off requests instantly with automated admin routing.",
    },
    {
      icon: FaChartBar,
      title: "Personal Insights",
      description:
        "Review your attendance streaks, total hours worked, and personalized work patterns on your dashboard.",
    },
    {
      icon: FaShieldAlt,
      title: "Secure & Private",
      description:
        "Your employee data is protected with enterprise-grade security and strict role-based access.",
    },
  ],

  highlightCard: {
    icon: FaBolt,
    title: "Enhancing Your Workday",
    description:
      "We leverage automation to make team administration invisible, giving you more time to focus on your actual work.",
    stats: [
      { icon: FaMobileAlt, value: "100%", label: "Live Tracking Sync" },
      { icon: FaCalendarCheck, value: "24/7", label: "Portal Accessibility" },
      { icon: FaFingerprint, value: "Zero", label: "Manual Paperwork" },
    ],
  },

  form: {
    title: "Staff Login",
    subtitle: "Welcome back! Please sign in to access your workspace.",
    emailLabel: "Employee Email",
    emailPlaceholder: "employee@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••••",
    rememberLabel: "Remember me",
    forgotLabel: "Forgot Password?",
    forgotHref: "/forgot-password",
    submitLabel: "Sign In",
    submitLoadingLabel: "Authenticating...",
    dividerLabel: "or",
    registerPrompt: "Need portal access?",
    registerLabel: "Contact Admin",
    registerHref: "#", // Usually internal staff don't self-register, but you can route this to an IT/Admin mailto or internal form
    securityNote: "Your session is protected with end-to-end encryption.",
    brandName: "Staff Portal",
    copyrightSuffix: "All rights reserved.",
  },
};

/**
 * CONSULTATION VARIANT
 * Same structure as loginPageContent — swap it in wherever you want the
 * consultation story instead of the generic CRM one.
 */
export const consultPageContent: LoginPageContent = {
  illustration: "/bglogo.png",

  heading: {
    lineOne: "AI Agents That",
    lineTwo: "Close More ",
    highlight: "Leads.",
  },

  description:
    "Consultancy CRM runs a team of AI agents alongside yours. They find the right prospects, score them, reach out, and tell you exactly who to call next — so your team spends its time closing, not sorting.",

  features: [
    {
      icon: FaLightbulb,
      title: "Consultation Recommendation Agent",
      description:
        "Matches every lead with the right service and consultant based on their profile and intent.",
    },
    {
      icon: FaEnvelopeOpenText,
      title: "Email Campaign Agent",
      description:
        "Writes, personalizes, and sends follow-up sequences, then adapts them to how each lead responds.",
    },
    {
      icon: FaBrain,
      title: "Lead Insight Agent",
      description:
        "Surfaces buying signals, engagement patterns, and pipeline risks from your lead data in real time.",
    },
    {
      icon: FaUserCheck,
      title: "Lead Qualification Agent",
      description:
        "Scores and sorts incoming leads automatically so your team only works the ones worth working.",
    },
  ],

  highlightCard: {
    icon: FaRobot,
    title: "Your AI Sales Team",
    description:
      "Four agents working around the clock to generate, qualify, and nurture every lead in your pipeline.",
    stats: [
      { icon: FaFunnelDollar, value: "3x", label: "More Qualified Leads" },
      { icon: FaBolt, value: "24/7", label: "Agents Working" },
      { icon: FaChartLine, value: "60%", label: "Less Manual Work" },
    ],
  },

  form: {
    title: "Admin Login",
    subtitle: "Welcome back! Please login to continue.",
    emailLabel: "Email Address",
    emailPlaceholder: "admin@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••••",
    rememberLabel: "Remember me",
    forgotLabel: "Forgot Password?",
    forgotHref: "/forgot-password",
    submitLabel: "Login",
    submitLoadingLabel: "Logging in...",
    dividerLabel: "or",
    registerPrompt: "Don't have an Account?",
    registerLabel: "Register",
    registerHref: "/register",
    securityNote: "Your data is protected with enterprise-grade security.",
    brandName: "Consultancy CRM",
    copyrightSuffix: "All rights reserved.",
  },
};





/**
 * ── SINGLE SWITCH POINT ──
 * Change the import above to pick which content set both auth pages use:
 *   consultPageContent | aiAgentsPageContent | loginPageContent
 * Nothing else needs to be touched — the login page and the register page
 * both read from here.
 */


const activeContent = loginPageContent;


export const loginLeftPanel = {
  heading: activeContent.heading,
  description: activeContent.description,
  features: activeContent.features,
  highlightCard: activeContent.highlightCard,
  illustration: activeContent.illustration,
};

export const loginFormContent = activeContent.form;

export default loginFormContent;