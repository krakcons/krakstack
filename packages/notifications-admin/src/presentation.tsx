import { createContext, useContext, type ReactNode } from "react";
import { DataTable } from "@krak-stack/registry/data-table";

export interface NotificationPresentation {
  readonly Table: typeof DataTable;
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

export const NotificationTable: typeof DataTable = (props) => {
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
