import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";

export default async function TherapistOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role === "therapist") {
    // If they already have the therapist role, they've already onboarded
    redirect("/therapist/dashboard");
  }

  return <>{children}</>;
}
