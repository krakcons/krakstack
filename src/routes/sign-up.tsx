import { Signup } from "@krak-stack/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <Signup />
    </main>
  );
}
