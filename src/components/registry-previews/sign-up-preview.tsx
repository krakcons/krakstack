import { SignUp } from "@/components/sign-up";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignUpPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Sign Up Form</CardTitle>
        <CardDescription>
          This preview renders the site-local Better Auth email/password registration component.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <SignUp />
      </CardContent>
    </Card>
  );
}
