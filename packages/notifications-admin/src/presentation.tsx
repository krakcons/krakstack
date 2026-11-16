import { createContext, useContext, type ReactNode } from "react";
import { DataTable } from "@krak-stack/registry/data-table";
import type {
  DataTableColDef,
  DataTableProps,
} from "@krak-stack/registry/data-table";

export type NotificationTableId =
  | "delivery-activity"
  | "delivery-attempts"
  | "operations-activity"
  | "feedback"
  | "suppressions"
  | "suppression-audit"
  | "campaign-recipients"
  | "operations-attempts";

export interface NotificationTableOptions<Row extends object> {
  readonly columns?: (
    defaults: ReadonlyArray<DataTableColDef<Row>>,
  ) => ReadonlyArray<DataTableColDef<Row>>;
  readonly initialState?: DataTableProps<Row>["initialState"];
  readonly className?: string;
}

export type NotificationTableProps<Row extends object> = DataTableProps<Row> & {
  readonly notificationTable?: NotificationTableId;
};
export type NotificationTableRenderer = <Row extends object>(
  props: NotificationTableProps<Row>,
) => ReactNode;

export interface NotificationPresentation {
  readonly Table: NotificationTableRenderer;
  readonly renderReference?: (kind: string, id: string) => ReactNode;
}
const PresentationContext = createContext<NotificationPresentation>({
  Table: DataTable,
});

/** Host-owned appearance and identity labels; never supplies authorization. */
export const NotificationPresentationProvider = ({
  children,
  ...presentation
}: NotificationPresentation & { children: ReactNode }) => (
  <PresentationContext.Provider value={presentation}>
    {children}
  </PresentationContext.Provider>
);

export const NotificationTable = <Row extends object>(
  props: NotificationTableProps<Row>,
) => {
  const { Table } = useContext(PresentationContext);
  return <Table {...props} />;
};

export const NotificationReference = ({
  kind,
  id,
}: {
  kind: string;
  id: string | null | undefined;
}) => {
  const { renderReference } = useContext(PresentationContext);
  return id ? (renderReference ? renderReference(kind, id) : id) : "—";
};
