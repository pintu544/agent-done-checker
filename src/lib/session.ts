import { auth } from "@/auth";

export async function getSessionUser(): Promise<{ id: string } | null> {
  // Test-only session override. Never set this flag on Vercel.
  if (process.env.NODE_ENV !== "production" && process.env.ADC_TEST_SESSION_USER_ID) {
    return { id: process.env.ADC_TEST_SESSION_USER_ID };
  }

  const session = await auth();
  const id = session?.user?.id;
  return typeof id === "string" && id ? { id } : null;
}
