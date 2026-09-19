import { redirect } from "next/navigation";
import { getUserRole } from "@/utils/authRole";

export default async function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  if (role === "therapist") {
    redirect("/therapist/dashboard");
  } else if (role === null) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
