import { SignUp } from "@/components/sign-up";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <SignUp />
    </main>
  );
}
