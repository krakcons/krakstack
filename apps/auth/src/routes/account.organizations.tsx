import { createFileRoute } from "@tanstack/react-router";
import { Building2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { useAppForm } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { m } from "@/paraglide/messages";
import { authClient } from "@/services/auth/client";

export const Route = createFileRoute("/account/organizations")({
  component: OrganizationsPage,
});

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function OrganizationsPage() {
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    await organizations.refetch();
    await activeOrganization.refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {m.organizations_title()}
        </h1>
        <p className="text-muted-foreground">{m.organizations_description()}</p>
      </div>
      <CreateOrganizationCard
        onCreated={async () => {
          setMessage(m.organization_created_message());
          await refresh();
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>{m.organizations_your_title()}</CardTitle>
          <CardDescription>
            {m.organizations_your_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {organizations.isPending ? (
            <p className="text-muted-foreground text-sm">{m.loading()}</p>
          ) : null}
          {organizations.error ? (
            <p className="text-destructive text-sm">
              {organizations.error.message}
            </p>
          ) : null}
          {organizations.data?.length ? (
            organizations.data.map((organization) => {
              const isActive = activeOrganization.data?.id === organization.id;

              return (
                <div
                  key={organization.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                      <Building2 />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {organization.name}
                        </p>
                        {isActive ? (
                          <Badge>
                            <CheckCircle2 />
                            {m.organization_active()}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {organization.slug}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isActive}
                    onClick={async () => {
                      const result = await authClient.organization.setActive({
                        organizationId: organization.id,
                      });
                      if (!result.error) await refresh();
                    }}
                  >
                    {m.organization_set_active()}
                  </Button>
                </div>
              );
            })
          ) : !organizations.isPending ? (
            <p className="text-muted-foreground text-sm">
              {m.organizations_empty()}
            </p>
          ) : null}
          {message ? (
            <p className="text-muted-foreground text-sm">{message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateOrganizationCard({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const form = useAppForm({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const name = value.name.trim();
      const slug = (value.slug.trim() || slugify(name)).toLowerCase();

      const result = await authClient.organization.create({
        name,
        slug,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.organization_create_error(),
            fields: {},
          },
        });
        return;
      }

      form.reset();
      await onCreated();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.organization_create_title()}</CardTitle>
        <CardDescription>{m.organization_create_description()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form
            className="flex max-w-xl flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField name="name">
              {(field) => (
                <field.TextField label={m.organization_name()} required />
              )}
            </form.AppField>
            <form.AppField name="slug">
              {(field) => (
                <field.TextField
                  label={m.organization_slug()}
                  description={m.organization_slug_description()}
                />
              )}
            </form.AppField>
            <form.FormError />
            <form.SubmitButton />
          </form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
