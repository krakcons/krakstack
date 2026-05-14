import { createFileRoute } from "@tanstack/react-router";
import type { ApiKey } from "@better-auth/api-key/client";
import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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

export const Route = createFileRoute("/account/api-keys")({
  component: ApiKeysPage,
});

type KeyScope =
  | { configId: "user"; organizationId?: undefined }
  | { configId: "organization"; organizationId: string };

type ApiKeySummary = Omit<ApiKey, "key">;

function ApiKeysPage() {
  const organizations = authClient.useListOrganizations();
  const activeOrganization = authClient.useActiveOrganization();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (selectedOrganizationId || !organizations.data?.length) return;
    setSelectedOrganizationId(
      activeOrganization.data?.id ?? organizations.data[0].id,
    );
  }, [activeOrganization.data?.id, organizations.data, selectedOrganizationId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {m.api_keys_title()}
        </h1>
        <p className="text-muted-foreground">{m.api_keys_description()}</p>
      </div>
      <ApiKeyCard
        title={m.api_keys_user_title()}
        description={m.api_keys_user_description()}
        scope={{ configId: "user" }}
      />
      <Card>
        <CardHeader>
          <CardTitle>{m.api_keys_organization_title()}</CardTitle>
          <CardDescription>
            {m.api_keys_organization_description()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {organizations.data?.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                {organizations.data.map((organization) => (
                  <Button
                    key={organization.id}
                    type="button"
                    variant={
                      selectedOrganizationId === organization.id
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setSelectedOrganizationId(organization.id)}
                  >
                    {organization.name}
                  </Button>
                ))}
              </div>
              {selectedOrganizationId ? (
                <ApiKeyManager
                  scope={{
                    configId: "organization",
                    organizationId: selectedOrganizationId,
                  }}
                />
              ) : null}
            </>
          ) : organizations.isPending ? (
            <p className="text-muted-foreground text-sm">{m.loading()}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {m.api_keys_no_organizations()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeyCard({
  title,
  description,
  scope,
}: {
  title: string;
  description: string;
  scope: KeyScope;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeyManager scope={scope} />
      </CardContent>
    </Card>
  );
}

function ApiKeyManager({ scope }: { scope: KeyScope }) {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKeys = async (nextScope: KeyScope = scope) => {
    setLoading(true);
    setError(null);
    const result = await authClient.apiKey.list({
      query: {
        configId: nextScope.configId,
        ...(nextScope.organizationId
          ? { organizationId: nextScope.organizationId }
          : {}),
      },
    });

    if (result.error) {
      setError(result.error.message ?? m.api_keys_load_error());
      setLoading(false);
      return;
    }

    setKeys(result.data?.apiKeys ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const loadScopedKeys = async () => {
      setLoading(true);
      setError(null);
      const result = await authClient.apiKey.list({
        query: {
          configId: scope.configId,
          ...(scope.organizationId
            ? { organizationId: scope.organizationId }
            : {}),
        },
      });

      if (result.error) {
        setError(result.error.message ?? m.api_keys_load_error());
        setLoading(false);
        return;
      }

      setKeys(result.data?.apiKeys ?? []);
      setLoading(false);
    };

    void loadScopedKeys();
  }, [scope.configId, scope.organizationId]);

  const createForm = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      setCreatedKey(null);
      const result = await authClient.apiKey.create({
        configId: scope.configId,
        name: value.name.trim(),
        ...(scope.organizationId
          ? { organizationId: scope.organizationId }
          : {}),
      });

      if (result.error || !result.data) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error?.message ?? m.api_key_create_error(),
            fields: {},
          },
        });
        return;
      }

      setCreatedKey(result.data.key);
      createForm.reset();
      await loadKeys();
    },
  });

  const deleteKey = async (key: ApiKeySummary) => {
    const result = await authClient.apiKey.delete({
      configId: scope.configId,
      keyId: key.id,
    });

    if (result.error) {
      setError(result.error.message ?? m.api_key_delete_error());
      return;
    }

    await loadKeys();
  };

  return (
    <div className="flex flex-col gap-5">
      <createForm.AppForm>
        <form
          className="flex max-w-xl flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            createForm.handleSubmit();
          }}
        >
          <createForm.AppField name="name">
            {(field) => <field.TextField label={m.api_key_name()} required />}
          </createForm.AppField>
          <createForm.FormError />
          <createForm.SubmitButton />
        </form>
      </createForm.AppForm>
      {createdKey ? (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound />
            {m.api_key_created_title()}
          </div>
          <p className="text-muted-foreground text-sm">
            {m.api_key_created_description()}
          </p>
          <code className="bg-muted overflow-x-auto rounded-md p-3 text-sm">
            {createdKey}
          </code>
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {loading ? (
        <p className="text-muted-foreground text-sm">{m.loading()}</p>
      ) : null}
      {!loading && keys.length === 0 ? (
        <p className="text-muted-foreground text-sm">{m.api_keys_empty()}</p>
      ) : null}
      <div className="flex flex-col gap-3">
        {keys.map((key) => (
          <div
            key={key.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{key.name}</p>
                <Badge variant={key.enabled ? "default" : "secondary"}>
                  {key.enabled ? m.api_key_enabled() : m.api_key_disabled()}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {key.start
                  ? m.api_key_starts_with({ start: key.start })
                  : m.api_key_hidden()}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteKey(key)}
            >
              <Trash2 data-icon="inline-start" />
              {m.delete()}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
