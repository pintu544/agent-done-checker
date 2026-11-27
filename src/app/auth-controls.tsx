import { auth, signIn, signOut } from "@/auth";

export async function AuthControls() {
  const session = await auth();

  if (session?.user?.id) {
    return (
      <form className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <span className="wrap-anywhere">{session.user.email}</span>
        <button className="adc-link cursor-pointer" type="submit">Sign out</button>
      </form>
    );
  }

  return (
    <form action={async () => {
      "use server";
      await signIn("github");
    }}>
      <button className="adc-link cursor-pointer text-sm" type="submit">Sign in with GitHub</button>
    </form>
  );
}
