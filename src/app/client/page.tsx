import { redirect } from "next/navigation";

export default function ClientRootPage() {
  // Instantly redirect users who land on /client to the dashboard
  redirect("/client/dashboard");
}