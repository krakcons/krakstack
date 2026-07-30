import { ResetPassword } from "@krak-stack/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <ResetPassword />
    </main>
  );
}
