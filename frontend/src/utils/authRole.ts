import { auth } from "@clerk/nextjs/server";

export async function getUserRole(): Promise<string | null> {
  const { getToken } = await auth();
  const token = await getToken();

  console.log("SERVER AUTH ROLE TOKEN:", token);

  if (!token) return null;

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${API_URL}/api/v1/users/me/role`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Do not cache this, it should be evaluated on request
    });

    if (response.ok) {
      const data = await response.json();
      return data.role; // "parent" | "therapist" | null
    }
  } catch (error) {
    console.error("Failed to fetch user role:", error);
  }

  return null;
}
