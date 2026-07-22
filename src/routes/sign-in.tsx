import { Signin } from "@krak-stack/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Signin />
    </main>
  );
}
