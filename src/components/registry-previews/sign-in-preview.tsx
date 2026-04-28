import { SignIn } from "@/components/sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SignInPreview() {
  return (
    <Card className="bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Sign In Form</CardTitle>
        <CardDescription>
          This preview renders the site-local Better Auth email/password sign-in component.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <SignIn />
      </CardContent>
    </Card>
  );
}
