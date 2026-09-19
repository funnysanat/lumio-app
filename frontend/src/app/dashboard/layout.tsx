import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role === "therapist") {
    redirect("/therapist/dashboard");
  } else if (role === null) {
    // If they haven't completed onboarding, they don't have a role yet
    redirect("/onboarding");
  }

  // If role is "parent", let them through
  return <>{children}</>;
}
