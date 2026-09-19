import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";

export default async function TherapistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role === "parent") {
    redirect("/dashboard");
  } else if (role === null) {
    // If they signed up via the therapist join page but haven't finished onboarding
    redirect("/therapist/onboarding");
  }

  // If role is "therapist", let them through
  return <>{children}</>;
}
