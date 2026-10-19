// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import type { EventLogRecord } from "../schema";
import { AuditLogTable, type AuditActor } from "./audit-log-table";

afterEach(cleanup);

const entry = (
  type: AuditActor["type"],
  id: string,
  impersonatorId?: string,
): EventLogRecord => {
  const attributes = Object.entries({
    "app.actor.type": type,
    "app.actor.id": id,
  }).map(([key, stringValue]) => ({ key, value: { stringValue } }));
  if (impersonatorId) {
    attributes.push({
      key: "app.auth.impersonator.id",
      value: { stringValue: impersonatorId },
    });
  }
  return {
    eventName: `task.${type}`,
    timeUnixNano: "1000000000",
    attributes,
  };
};

describe("audit actor resolution", () => {
  it("matches both type and ID and resolves impersonators from user actors", () => {
    render(
      <AuditLogTable
        entries={[
          entry("user", "shared", "admin"),
          entry("organization", "shared"),
        ]}
        rowCount={2}
        actors={[
          {
            type: "user",
            id: "shared",
            label: "Ada",
            description: "ada@example.test",
          },
          { type: "organization", id: "shared", label: "Acme" },
          { type: "organization", id: "admin", label: "Not the impersonator" },
          { type: "user", id: "admin", label: "Grace" },
        ]}
      />,
    );
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("ada@example.test")).toBeTruthy();
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(screen.getByText("Impersonated by: Grace")).toBeTruthy();
    expect(screen.queryByText("Not the impersonator")).toBeNull();
  });

  it("uses a neutral fallback until profiles arrive and retains unresolved impersonator IDs", () => {
    const entries = [entry("user", "unresolved-user", "unresolved-admin")];
    const { rerender } = render(
      <AuditLogTable entries={entries} rowCount={1} />,
    );
    expect(screen.getByText("Member")).toBeTruthy();
    expect(screen.getByText("unresolved-user")).toBeTruthy();
    expect(screen.getByText("Impersonated by: unresolved-admin")).toBeTruthy();
    expect(screen.queryByText("Former member")).toBeNull();

    rerender(
      <AuditLogTable
        entries={entries}
        rowCount={1}
        actors={[
          { type: "user", id: "unresolved-user", label: "Loaded member" },
        ]}
      />,
    );
    expect(screen.getByText("Loaded member")).toBeTruthy();
    expect(screen.queryByText("Member")).toBeNull();
  });
});
