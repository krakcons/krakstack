import { m } from "@/paraglide/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppForm } from "@/components/form";
import { cn } from "@/lib/utils";
import { LogOutIcon, UserCircleIcon, UserIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { authClient } from "@/lib/auth-client";

type UserFormType = {
  name: string;
};

type UserDropdownProps = {
  signOutRedirect?: string;
  side?: ComponentProps<typeof DropdownMenuContent>["side"];
};

export const UserButton = ({
  signOutRedirect = "/",
  side = "bottom",
}: UserDropdownProps) => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const [accountDialog, setAccountDialog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!session) {
    return (
      <Button onClick={() => window.location.assign("/sign-in")} variant="outline">
        Sign In
      </Button>
    );
  }

  const displayName = session.user.name.trim();
  const displayEmail = session.user.email.trim();

  const signOut = async () => {
    await authClient.signOut();
    window.location.assign(signOutRedirect);
  };

  const updateUser = async (values: UserFormType) => {
    setFormError(null);
    const result = await authClient.updateUser(values);

    if (isAuthErrorResult(result)) {
      throw new Error(result.error.message || m.user_form_update_error());
    }

    await refetch();

    setAccountDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" className="rounded-full">
              <UserIcon className="size-4.5" />
              <span className="sr-only">{m.user_button_aria_label()}</span>
            </Button>
          }
        />
        <DropdownMenuContent className="min-w-56 rounded-lg" side={side} align="end" sideOffset={4}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserIcon className="size-4.5" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {displayName && (
                    <span className="truncate font-medium text-foreground">{displayName}</span>
                  )}
                  {displayEmail && (
                    <span
                      className={cn("truncate text-xs", displayName && "text-muted-foreground")}
                    >
                      {displayEmail}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isPending} onClick={() => setAccountDialog(true)}>
              <UserCircleIcon />
              {m.user_button_account()}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOutIcon />
              {m.user_button_logout()}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.user_form_title()}</DialogTitle>
            <DialogDescription>{m.user_form_description()}</DialogDescription>
          </DialogHeader>
          <UserForm
            defaultValues={{
              name: displayName ?? "",
            }}
            error={formError}
            onSubmit={async (data) => {
              try {
                await updateUser(data);
              } catch (error) {
                setFormError(error instanceof Error ? error.message : m.user_form_update_error());
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const UserForm = ({
  defaultValues,
  error,
  onSubmit,
}: {
  defaultValues: UserFormType;
  error?: string | null;
  onSubmit: (values: UserFormType) => Promise<void>;
}) => {
  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.AppForm>
        <form.AppField name="name">
          {(field) => (
            <field.TextField label={m.user_form_name_label()} autoComplete="name" required />
          )}
        </form.AppField>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
};

const isAuthErrorResult = (result: unknown): result is { error: { message?: string } } => {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "object" &&
    result.error !== null
  );
};
