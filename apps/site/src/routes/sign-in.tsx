import { SignIn } from "@/components/sign-in";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <SignIn />
    </main>
  );
}
