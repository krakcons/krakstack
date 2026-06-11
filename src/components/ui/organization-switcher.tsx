import type { ApiKey } from "@better-auth/api-key/client";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  ChevronsUpDown,
  KeyRound,
  PencilIcon,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

import {
  createDataTableActionsColumn,
  DataTable,
} from "@/components/ui/data-table";
import {
  EditingLocaleSwitcher,
  type EditingLocale,
} from "@/components/ui/editing-locale-switcher";
import { AppBrand } from "@/components/ui/app-brand";
import { useAppForm } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { centralAuthClient } from "@/services/auth/client/central";

type OrganizationSwitcherProps = {
  side?: ComponentProps<typeof DropdownMenuContent>["side"];
  className?: string;
  renderUnauthenticated?: () => ReactNode;
  locked?: boolean;
};

type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  metadata?: unknown;
};

type OrganizationDialog = "create" | "manage" | "members" | "apiKeys";
type ApiKeySummary = Omit<ApiKey, "key">;
type OrganizationLocale = EditingLocale;
type ActiveOrganization = NonNullable<
  ReturnType<typeof centralAuthClient.useActiveOrganization>["data"]
>;
type OrganizationMemberSummary = ActiveOrganization["members"][number];
type OrganizationInvitationSummary = ActiveOrganization["invitations"][number];
type OrganizationRole = "owner" | "admin" | "member";

type OrganizationTranslation = {
  locale: OrganizationLocale;
  name: string;
  logo: string | null;
  contactEmail: string | null;
  location: string | null;
};

type OrganizationMetadata = {
  translations: OrganizationTranslation[];
};

type OrganizationFormValues = {
  name: string;
  slug: string;
  enName: string;
  enLogo: File | null;
  enLogoUrl: string;
  enContactEmail: string;
  enLocation: string;
  frName: string;
  frLogo: File | null;
  frLogoUrl: string;
  frContactEmail: string;
  frLocation: string;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isOrganizationLocale = (value: unknown): value is OrganizationLocale =>
  value === "en" || value === "fr";

const nullableString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const optionalString = (value: unknown) => nullableString(value) ?? "";

const centralAuthUrl = (path: string) =>
  new URL(path, import.meta.env.VITE_KRAKSTACK_AUTH_URL).toString();

const parsePresignedUpload = (value: unknown) => {
  if (
    !isRecord(value) ||
    typeof value.uploadUrl !== "string" ||
    typeof value.url !== "string"
  ) {
    throw new Error(m.organization_logo_upload_error());
  }

  return { uploadUrl: value.uploadUrl, url: value.url };
};

const uploadOrganizationLogo = async (file: File) => {
  const contentType = file.type || "image/png";
  const presignResponse = await fetch(
    centralAuthUrl("/api/organizations/logo/presign"),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType }),
    },
  );

  if (!presignResponse.ok) {
    throw new Error(m.organization_logo_upload_error());
  }

  const presigned = parsePresignedUpload(await presignResponse.json());
  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(m.organization_logo_upload_error());
  }

  return centralAuthUrl(presigned.url);
};

const currentOrganizationLocale = (): OrganizationLocale =>
  getLocale() === "fr" ? "fr" : "en";

const parseOrganizationMetadata = (metadata: unknown): OrganizationMetadata => {
  if (!isRecord(metadata) || !Array.isArray(metadata.translations)) {
    return { translations: [] };
  }

  return {
    translations: metadata.translations.flatMap((translation) => {
      if (!isRecord(translation) || !isOrganizationLocale(translation.locale)) {
        return [];
      }

      return [
        {
          locale: translation.locale,
          name: optionalString(translation.name),
          logo: nullableString(translation.logo),
          contactEmail: nullableString(translation.contactEmail),
          location: nullableString(translation.location),
        },
      ];
    }),
  };
};

const findOrganizationTranslation = (
  organization: OrganizationSummary,
  locale = currentOrganizationLocale(),
) => {
  const translations = parseOrganizationMetadata(
    organization.metadata,
  ).translations;

  return (
    translations.find((translation) => translation.locale === locale) ??
    translations.find((translation) => translation.locale === "en") ??
    translations[0]
  );
};

const organizationDisplay = (organization: OrganizationSummary | null) => {
  const translation = organization
    ? findOrganizationTranslation(organization)
    : undefined;

  return {
    name:
      translation?.name ||
      organization?.name ||
      m.organization_switcher_label(),
    subtitle: organization?.slug ?? m.organization_switcher_label(),
    logo: translation?.logo ? centralAuthUrl(translation.logo) : undefined,
  };
};

const organizationFormDefaults = (
  organization?: OrganizationSummary,
): OrganizationFormValues => {
  const translations = parseOrganizationMetadata(
    organization?.metadata,
  ).translations;
  const en = translations.find((translation) => translation.locale === "en");
  const fr = translations.find((translation) => translation.locale === "fr");

  return {
    name: organization?.name ?? "",
    slug: organization?.slug ?? "",
    enName: en?.name || organization?.name || "",
    enLogo: null,
    enLogoUrl: en?.logo ?? "",
    enContactEmail: en?.contactEmail ?? "",
    enLocation: en?.location ?? "",
    frName: fr?.name ?? "",
    frLogo: null,
    frLogoUrl: fr?.logo ?? "",
    frContactEmail: fr?.contactEmail ?? "",
    frLocation: fr?.location ?? "",
  };
};

const organizationLogoFromForm = async (file: File | null, fallback: string) =>
  file ? await uploadOrganizationLogo(file) : nullableString(fallback);

const organizationRoles: OrganizationRole[] = ["owner", "admin", "member"];

const normalizeOrganizationRole = (role: string): OrganizationRole =>
  role === "owner" || role === "admin" || role === "member" ? role : "member";

const organizationRoleLabel = (role: string) => {
  switch (normalizeOrganizationRole(role)) {
    case "owner":
      return m.organization_role_owner();
    case "admin":
      return m.organization_role_admin();
    case "member":
      return m.organization_role_member();
  }
};

const formatOrganizationDate = (date: Date | string) =>
  new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium" }).format(
    new Date(date),
  );

const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const organizationMetadataFromForm = async (
  value: OrganizationFormValues,
): Promise<OrganizationMetadata> => {
  const translations: OrganizationTranslation[] = [];
  const enName = value.enName.trim() || value.name.trim();
  const frName = value.frName.trim();
  const enLogo = await organizationLogoFromForm(value.enLogo, value.enLogoUrl);
  const frLogo = await organizationLogoFromForm(value.frLogo, value.frLogoUrl);

  if (enName) {
    translations.push({
      locale: "en",
      name: enName,
      logo: enLogo,
      contactEmail: nullableString(value.enContactEmail),
      location: nullableString(value.enLocation),
    });
  }

  if (frName) {
    translations.push({
      locale: "fr",
      name: frName,
      logo: frLogo,
      contactEmail: nullableString(value.frContactEmail),
      location: nullableString(value.frLocation),
    });
  }

  return { translations };
};

export function OrganizationSwitcher({
  side = "bottom",
  className,
  renderUnauthenticated,
  locked = false,
}: OrganizationSwitcherProps) {
  const session = centralAuthClient.useSession();
  const organizations = centralAuthClient.useListOrganizations();
  const activeOrganization = centralAuthClient.useActiveOrganization();
  const [dialog, setDialog] = useState<OrganizationDialog | null>(null);

  if (!session.data) {
    return <>{renderUnauthenticated?.()}</>;
  }

  const active = activeOrganization.data;
  const activeName = active?.name;
  const selectableOrganizations = !locked
    ? (organizations.data?.filter(
        (organization) => organization.id !== active?.id,
      ) ?? [])
    : [];
  const hasOrganizationListItems =
    organizations.isPending || Boolean(organizations.error) || !locked;

  const refresh = async () => {
    await organizations.refetch();
    await activeOrganization.refetch();
  };

  const activeDisplay = organizationDisplay(active ?? null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className={cn(
                "h-11 w-full justify-between gap-3 px-2",
                className,
              )}
            >
              <AppBrand
                to={null}
                label={
                  activeName
                    ? activeDisplay.name
                    : m.organization_switcher_label()
                }
                subtitle={activeDisplay.subtitle}
                icon={Building2}
                className="min-w-0 flex-1 text-left"
                {...(activeDisplay.logo
                  ? { imageSrc: activeDisplay.logo }
                  : {})}
              />
              <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
            </Button>
          }
        />
        <DropdownMenuContent
          className="min-w-64 rounded-lg"
          side={side}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <AppBrand
                to={null}
                label={activeDisplay.name}
                subtitle={activeDisplay.subtitle}
                icon={Building2}
                className="px-1 py-1.5 text-left text-sm"
                {...(activeDisplay.logo
                  ? { imageSrc: activeDisplay.logo }
                  : {})}
              />
            </DropdownMenuLabel>
            {hasOrganizationListItems ? <DropdownMenuSeparator /> : null}
            {organizations.isPending ? (
              <DropdownMenuItem disabled>
                {m.organization_loading()}
              </DropdownMenuItem>
            ) : null}
            {organizations.error ? (
              <DropdownMenuItem disabled>
                {organizations.error.message}
              </DropdownMenuItem>
            ) : null}
            {!locked && selectableOrganizations.length ? (
              selectableOrganizations.map((organization) => {
                const display = organizationDisplay(organization);

                return (
                  <DropdownMenuItem
                    key={organization.id}
                    onClick={async () => {
                      const result =
                        await centralAuthClient.organization.setActive({
                          organizationId: organization.id,
                        });
                      if (!result.error) await refresh();
                    }}
                  >
                    <AppBrand
                      to={null}
                      label={display.name}
                      subtitle={display.subtitle}
                      icon={Building2}
                      className="w-full text-left [&>div:first-child]:size-7"
                      {...(display.logo ? { imageSrc: display.logo } : {})}
                    />
                  </DropdownMenuItem>
                );
              })
            ) : !locked && !organizations.isPending ? (
              <DropdownMenuItem disabled>
                {active
                  ? m.organization_switcher_no_other_organizations()
                  : m.organization_switcher_empty()}
              </DropdownMenuItem>
            ) : null}
            {!locked ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialog("create")}>
                  <Building2 />
                  {m.organization_create_title()}
                </DropdownMenuItem>
              </>
            ) : null}
            {activeOrganization.data ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDialog("manage")}>
                  <PencilIcon />
                  {m.organization_switcher_manage()}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("members")}>
                  <Users />
                  {m.organization_members_title()}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("apiKeys")}>
                  <KeyRound />
                  {m.user_button_api_keys()}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={dialog === "create"}
        onOpenChange={(open) => {
          setDialog((current) =>
            open ? "create" : current === "create" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.organization_create_title()}
            </DialogTitle>
            <DialogDescription>
              {m.organization_create_description()}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <CreateOrganizationSection
            onCreated={async () => {
              await refresh();
              setDialog(null);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "manage"}
        onOpenChange={(open) => {
          setDialog((current) =>
            open ? "manage" : current === "manage" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.organization_switcher_manage()}
            </DialogTitle>
            <DialogDescription>
              {m.organization_edit_description()}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {activeOrganization.data ? (
            <EditOrganizationSection
              organization={activeOrganization.data}
              onUpdated={refresh}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "members"}
        onOpenChange={(open) => {
          setDialog((current) =>
            open ? "members" : current === "members" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.organization_members_title()}
            </DialogTitle>
            <DialogDescription>
              {activeOrganization.data?.name}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {activeOrganization.data ? (
            <OrganizationMembersManager
              organization={activeOrganization.data}
              currentUserId={session.data.user.id}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "apiKeys"}
        onOpenChange={(open) => {
          setDialog((current) =>
            open ? "apiKeys" : current === "apiKeys" ? null : current,
          );
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {m.user_api_keys_title()}
            </DialogTitle>
            <DialogDescription>
              {activeOrganization.data?.name}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {activeOrganization.data ? (
            <OrganizationApiKeyManager organization={activeOrganization.data} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditOrganizationSection({
  organization,
  onUpdated,
}: {
  organization: OrganizationSummary;
  onUpdated: () => Promise<void>;
}) {
  const [editingLocale, setEditingLocale] = useState<OrganizationLocale>(
    currentOrganizationLocale(),
  );
  const defaultValues = organizationFormDefaults(organization);
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const name = value.name.trim();
      const slug = value.slug.trim().toLowerCase();
      const metadata = await organizationMetadataFromForm(value);

      const result = await centralAuthClient.organization.update({
        organizationId: organization.id,
        data: { name, slug, metadata },
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.organization_update_error(),
            fields: {},
          },
        });
        return;
      }

      await onUpdated();
    },
  });

  return (
    <section className="flex flex-col gap-4">
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
              <field.TextField label={m.organization_slug()} required />
            )}
          </form.AppField>
          <Separator className="my-2" />
          {editingLocale === "en" ? (
            <>
              <OrganizationTranslationHeader
                locale="en"
                editingLocale={editingLocale}
                onEditingLocaleChange={setEditingLocale}
              />
              <form.AppField name="enName">
                {(field) => (
                  <field.TextField
                    label={m.organization_translation_name()}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="enLogo">
                {(field) => (
                  <field.ImageField
                    label={m.organization_logo()}
                    defaultImageUrl={defaultValues.enLogoUrl}
                    size={{
                      width: 96,
                      height: 96,
                      suggestedWidth: 512,
                      suggestedHeight: 512,
                    }}
                  />
                )}
              </form.AppField>
              <form.AppField name="enContactEmail">
                {(field) => (
                  <field.TextField
                    label={m.organization_contact_email()}
                    placeholder="team@example.com"
                    type="email"
                  />
                )}
              </form.AppField>
              <form.AppField name="enLocation">
                {(field) => (
                  <field.TextField label={m.organization_location()} />
                )}
              </form.AppField>
            </>
          ) : (
            <>
              <OrganizationTranslationHeader
                locale="fr"
                editingLocale={editingLocale}
                onEditingLocaleChange={setEditingLocale}
              />
              <form.AppField name="frName">
                {(field) => (
                  <field.TextField label={m.organization_translation_name()} />
                )}
              </form.AppField>
              <form.AppField name="frLogo">
                {(field) => (
                  <field.ImageField
                    label={m.organization_logo()}
                    defaultImageUrl={defaultValues.frLogoUrl}
                    size={{
                      width: 96,
                      height: 96,
                      suggestedWidth: 512,
                      suggestedHeight: 512,
                    }}
                  />
                )}
              </form.AppField>
              <form.AppField name="frContactEmail">
                {(field) => (
                  <field.TextField
                    label={m.organization_contact_email()}
                    placeholder="team@example.com"
                    type="email"
                  />
                )}
              </form.AppField>
              <form.AppField name="frLocation">
                {(field) => (
                  <field.TextField label={m.organization_location()} />
                )}
              </form.AppField>
            </>
          )}
          <form.FormError />
          <form.SubmitButton />
        </form>
      </form.AppForm>
    </section>
  );
}

function CreateOrganizationSection({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const [editingLocale, setEditingLocale] = useState<OrganizationLocale>(
    currentOrganizationLocale(),
  );
  const defaultValues = organizationFormDefaults();
  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const name = value.name.trim();
      const slug = (value.slug.trim() || slugify(name)).toLowerCase();
      const metadata = await organizationMetadataFromForm({
        ...value,
        name,
        slug,
      });

      const result = await centralAuthClient.organization.create({
        name,
        slug,
        metadata,
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
    <section className="flex flex-col gap-4">
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
          <Separator className="my-2" />
          {editingLocale === "en" ? (
            <>
              <OrganizationTranslationHeader
                locale="en"
                editingLocale={editingLocale}
                onEditingLocaleChange={setEditingLocale}
              />
              <form.AppField name="enName">
                {(field) => (
                  <field.TextField
                    label={m.organization_translation_name()}
                    required
                  />
                )}
              </form.AppField>
              <form.AppField name="enLogo">
                {(field) => (
                  <field.ImageField
                    label={m.organization_logo()}
                    defaultImageUrl={defaultValues.enLogoUrl}
                    size={{
                      width: 96,
                      height: 96,
                      suggestedWidth: 512,
                      suggestedHeight: 512,
                    }}
                  />
                )}
              </form.AppField>
              <form.AppField name="enContactEmail">
                {(field) => (
                  <field.TextField
                    label={m.organization_contact_email()}
                    placeholder="team@example.com"
                    type="email"
                  />
                )}
              </form.AppField>
              <form.AppField name="enLocation">
                {(field) => (
                  <field.TextField label={m.organization_location()} />
                )}
              </form.AppField>
            </>
          ) : (
            <>
              <OrganizationTranslationHeader
                locale="fr"
                editingLocale={editingLocale}
                onEditingLocaleChange={setEditingLocale}
              />
              <form.AppField name="frName">
                {(field) => (
                  <field.TextField label={m.organization_translation_name()} />
                )}
              </form.AppField>
              <form.AppField name="frLogo">
                {(field) => (
                  <field.ImageField
                    label={m.organization_logo()}
                    defaultImageUrl={defaultValues.frLogoUrl}
                    size={{
                      width: 96,
                      height: 96,
                      suggestedWidth: 512,
                      suggestedHeight: 512,
                    }}
                  />
                )}
              </form.AppField>
              <form.AppField name="frContactEmail">
                {(field) => (
                  <field.TextField
                    label={m.organization_contact_email()}
                    placeholder="team@example.com"
                    type="email"
                  />
                )}
              </form.AppField>
              <form.AppField name="frLocation">
                {(field) => (
                  <field.TextField label={m.organization_location()} />
                )}
              </form.AppField>
            </>
          )}
          <form.FormError />
          <form.SubmitButton />
        </form>
      </form.AppForm>
    </section>
  );
}

function OrganizationTranslationHeader({
  locale,
  editingLocale,
  onEditingLocaleChange,
}: {
  locale: OrganizationLocale;
  editingLocale: OrganizationLocale;
  onEditingLocaleChange: (locale: OrganizationLocale) => void;
}) {
  const title =
    locale === "en"
      ? m.organization_translation_english()
      : m.organization_translation_french();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">
          {m.organization_translation_description()}
        </p>
      </div>
      <EditingLocaleSwitcher
        value={editingLocale}
        onValueChange={onEditingLocaleChange}
      />
    </div>
  );
}

function OrganizationMembersManager({
  organization,
  currentUserId,
}: {
  organization: OrganizationSummary;
  currentUserId: string;
}) {
  const [members, setMembers] = useState<OrganizationMemberSummary[]>([]);
  const [invitations, setInvitations] = useState<
    OrganizationInvitationSummary[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<
    string | null
  >(null);

  const loadMembers = useEffectEvent(async () => {
    setLoading(true);
    setError(null);

    const [membersResult, invitationsResult] = await Promise.all([
      centralAuthClient.organization.listMembers({
        query: { organizationId: organization.id },
      }),
      centralAuthClient.organization.listInvitations({
        query: { organizationId: organization.id },
      }),
    ]);

    if (membersResult.error) {
      setError(
        membersResult.error.message ?? m.organization_members_load_error(),
      );
      setLoading(false);
      return;
    }

    if (invitationsResult.error) {
      setError(
        invitationsResult.error.message ??
          m.organization_invitations_load_error(),
      );
      setLoading(false);
      return;
    }

    setMembers(membersResult.data?.members ?? []);
    setInvitations(invitationsResult.data ?? []);
    setLoading(false);
  });

  useEffect(() => {
    void loadMembers();
  }, [organization.id]);

  const inviteForm = useAppForm({
    defaultValues: { email: "", role: "member" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      const result = await centralAuthClient.organization.inviteMember({
        email: value.email.trim(),
        role: normalizeOrganizationRole(value.role),
        organizationId: organization.id,
      });

      if (result.error) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message ?? m.organization_invite_error(),
            fields: {},
          },
        });
        return;
      }

      inviteForm.reset();
      await loadMembers();
    },
  });

  const updateRole = async (
    member: OrganizationMemberSummary,
    role: OrganizationRole,
  ) => {
    setUpdatingMemberId(member.id);
    setError(null);

    const result = await centralAuthClient.organization.updateMemberRole({
      memberId: member.id,
      role,
      organizationId: organization.id,
    });

    setUpdatingMemberId(null);

    if (result.error) {
      setError(result.error.message ?? m.organization_member_role_error());
      return;
    }

    await loadMembers();
  };

  const removeMember = async (member: OrganizationMemberSummary) => {
    setUpdatingMemberId(member.id);
    setError(null);

    const result = await centralAuthClient.organization.removeMember({
      memberIdOrEmail: member.id,
      organizationId: organization.id,
    });

    setUpdatingMemberId(null);

    if (result.error) {
      setError(result.error.message ?? m.organization_member_remove_error());
      return;
    }

    await loadMembers();
  };

  const cancelInvitation = async (
    invitation: OrganizationInvitationSummary,
  ) => {
    setCancellingInvitationId(invitation.id);
    setError(null);

    const result = await centralAuthClient.organization.cancelInvitation({
      invitationId: invitation.id,
    });

    setCancellingInvitationId(null);

    if (result.error) {
      setError(
        result.error.message ?? m.organization_invitation_cancel_error(),
      );
      return;
    }

    await loadMembers();
  };

  return (
    <div className="flex flex-col gap-5">
      <inviteForm.AppForm>
        <form
          className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            inviteForm.handleSubmit();
          }}
        >
          <div className="sm:col-span-3">
            <div className="flex items-center gap-2 font-medium">
              <UserPlus className="size-4" />
              {m.organization_invite_member_title()}
            </div>
            <p className="text-muted-foreground text-sm">
              {m.organization_invite_member_description()}
            </p>
          </div>
          <inviteForm.AppField name="email">
            {(field) => (
              <field.TextField
                label={m.organization_member_email()}
                placeholder="teammate@example.com"
                type="email"
                required
              />
            )}
          </inviteForm.AppField>
          <inviteForm.AppField name="role">
            {(field) => (
              <field.SelectField
                label={m.organization_member_role()}
                options={organizationRoles.map((role) => ({
                  label: organizationRoleLabel(role),
                  value: role,
                }))}
              />
            )}
          </inviteForm.AppField>
          <div className="self-end">
            <inviteForm.SubmitButton />
          </div>
          <inviteForm.FormError />
        </form>
      </inviteForm.AppForm>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium">{m.organization_members_heading()}</h3>
          <p className="text-muted-foreground text-sm">
            {m.organization_members_description()}
          </p>
        </div>
        <DataTable
          columns={memberColumns({
            currentUserId,
            updatingMemberId,
            onRemove: removeMember,
            onRoleChange: updateRole,
          })}
          data={members}
          emptyLabel={
            loading ? m.user_loading() : m.organization_members_empty()
          }
          exportFileName={`${organization.slug}-members.csv`}
          features={{ gallery: false }}
        />
      </section>
      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium">
            {m.organization_invitations_heading()}
          </h3>
          <p className="text-muted-foreground text-sm">
            {m.organization_invitations_description()}
          </p>
        </div>
        <DataTable
          columns={invitationColumns({
            cancellingInvitationId,
            onCancel: cancelInvitation,
          })}
          data={invitations}
          emptyLabel={
            loading ? m.user_loading() : m.organization_invitations_empty()
          }
          exportFileName={`${organization.slug}-invitations.csv`}
          features={{ gallery: false }}
        />
      </section>
    </div>
  );
}

const memberColumns = ({
  currentUserId,
  updatingMemberId,
  onRemove,
  onRoleChange,
}: {
  currentUserId: string;
  updatingMemberId: string | null;
  onRemove: (member: OrganizationMemberSummary) => void;
  onRoleChange: (
    member: OrganizationMemberSummary,
    role: OrganizationRole,
  ) => void;
}): ColumnDef<OrganizationMemberSummary>[] => [
  {
    id: "user",
    header: m.organization_member_user(),
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        {row.original.user.image ? (
          <img
            src={row.original.user.image}
            alt={row.original.user.name}
            className="size-9 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
            {initialsFromName(row.original.user.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.user.name}</p>
          <p className="text-muted-foreground truncate text-sm">
            {row.original.user.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: m.organization_member_role(),
    cell: ({ row }) => {
      const member = row.original;
      const disabled = updatingMemberId === member.id;

      return (
        <Select
          items={organizationRoles.map((role) => ({
            label: organizationRoleLabel(role),
            value: role,
          }))}
          value={normalizeOrganizationRole(member.role)}
          onValueChange={(value) => {
            if (value === "owner" || value === "admin" || value === "member") {
              onRoleChange(member, value);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-36"
            onClick={(event) => event.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {organizationRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {organizationRoleLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: m.organization_member_joined(),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatOrganizationDate(row.original.createdAt)}
      </span>
    ),
  },
  createDataTableActionsColumn<OrganizationMemberSummary>([
    {
      name: m.organization_member_remove(),
      icon: <Trash2 />,
      variant: "destructive",
      visible: (member) => member.userId !== currentUserId,
      onClick: onRemove,
    },
  ]),
];

const invitationColumns = ({
  cancellingInvitationId,
  onCancel,
}: {
  cancellingInvitationId: string | null;
  onCancel: (invitation: OrganizationInvitationSummary) => void;
}): ColumnDef<OrganizationInvitationSummary>[] => [
  {
    accessorKey: "email",
    header: m.organization_member_email(),
    cell: ({ row }) => (
      <p className="truncate font-medium">{row.original.email}</p>
    ),
  },
  {
    accessorKey: "role",
    header: m.organization_member_role(),
    cell: ({ row }) => (
      <Badge variant="secondary">
        {organizationRoleLabel(row.original.role)}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: m.organization_invitation_status(),
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
  {
    accessorKey: "expiresAt",
    header: m.organization_invitation_expires(),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatOrganizationDate(row.original.expiresAt)}
      </span>
    ),
  },
  createDataTableActionsColumn<OrganizationInvitationSummary>([
    {
      name: m.organization_invitation_cancel(),
      icon: <Trash2 />,
      variant: "destructive",
      visible: (invitation) => cancellingInvitationId !== invitation.id,
      onClick: onCancel,
    },
  ]),
];

function OrganizationApiKeyManager({
  organization,
}: {
  organization: OrganizationSummary;
}) {
  const [keys, setKeys] = useState<ApiKeySummary[]>([]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadKeys = useEffectEvent(async () => {
    setLoading(true);
    setError(null);
    const result = await centralAuthClient.apiKey.list({
      query: { configId: "organization", organizationId: organization.id },
    });

    if (result.error) {
      setError(result.error.message ?? m.user_api_keys_load_error());
      setLoading(false);
      return;
    }

    setKeys(result.data?.apiKeys ?? []);
    setLoading(false);
  });

  useEffect(() => {
    void loadKeys();
  }, [organization.id]);

  const createForm = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      formApi.setErrorMap({ onSubmit: undefined });
      setCreatedKey(null);
      const result = await centralAuthClient.apiKey.create({
        configId: "organization",
        organizationId: organization.id,
        name: value.name.trim(),
      });

      if (result.error || !result.data) {
        formApi.setErrorMap({
          onSubmit: {
            form: result.error?.message ?? m.user_api_key_create_error(),
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
    const result = await centralAuthClient.apiKey.delete({
      configId: "organization",
      keyId: key.id,
    });

    if (result.error) {
      setError(result.error.message ?? m.user_api_key_delete_error());
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
          <p className="text-muted-foreground text-sm">
            {m.api_key_rate_limit_notice()}
          </p>
          <createForm.AppField name="name">
            {(field) => (
              <field.TextField label={m.user_api_key_name()} required />
            )}
          </createForm.AppField>
          <createForm.FormError />
          <createForm.SubmitButton />
        </form>
      </createForm.AppForm>
      {createdKey ? (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound />
            {m.user_api_key_created_title()}
          </div>
          <p className="text-muted-foreground text-sm">
            {m.user_api_key_created_description()}
          </p>
          <code className="bg-muted overflow-x-auto rounded-md p-3 text-sm">
            {createdKey}
          </code>
        </div>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Separator />
      <DataTable
        columns={apiKeyColumns({ onDelete: deleteKey })}
        data={keys}
        emptyLabel={loading ? m.user_loading() : m.table_empty()}
        exportFileName={`${organization.slug}-api-keys.csv`}
        features={{ gallery: false }}
      />
    </div>
  );
}

const apiKeyColumns = ({
  onDelete,
}: {
  onDelete: (key: ApiKeySummary) => void;
}): ColumnDef<ApiKeySummary>[] => [
  {
    accessorKey: "name",
    header: m.user_api_key_name(),
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="text-muted-foreground text-sm">
          {row.original.start
            ? m.user_api_key_starts_with({ start: row.original.start })
            : m.user_api_key_hidden()}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "enabled",
    header: m.user_api_key_status(),
    cell: ({ row }) => (
      <Badge variant={row.original.enabled ? "default" : "secondary"}>
        {row.original.enabled
          ? m.user_api_key_enabled()
          : m.user_api_key_disabled()}
      </Badge>
    ),
  },
  createDataTableActionsColumn<ApiKeySummary>([
    {
      name: m.user_delete(),
      icon: <Trash2 />,
      variant: "destructive",
      onClick: onDelete,
    },
  ]),
];
