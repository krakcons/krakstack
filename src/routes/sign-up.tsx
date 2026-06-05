import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@/components/ui/sign-up";

export const Route = createFileRoute("/sign-up")({
  component: SignUp,
});
