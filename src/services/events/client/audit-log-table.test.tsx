// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach } from "vitest";
import type { EventLogRecord, EventQuery } from "../schema";
import { AuditLogTable } from "./audit-log-table";

afterEach(cleanup);

describe("server event-name filter", () => {
  it("resets the page, preserves the event during search, and supports clearing", () => {
    const changes: EventQuery[] = [];
    const ControlledTable = () => {
      const [state, setState] = useState<EventQuery>({ page: 2, pageSize: 20 });
      return (
        <AuditLogTable
          entries={[]}
          events={[{ value: "task.updated", label: "Task updated" }]}
          rowCount={80}
          state={state}
          onStateChange={(next) => {
            changes.push(next);
            setState(next);
          }}
        />
      );
    };
    render(<ControlledTable />);
    fireEvent.click(screen.getByRole("menuitem", { name: "Action" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Task updated" }));
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      pageSize: 20,
      eventName: "task.updated",
    });
    fireEvent.change(screen.getByPlaceholderText("Filter results..."), {
      target: { value: "Ada" },
    });
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      eventName: "task.updated",
      globalFilter: "Ada",
    });
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Action: Task updated" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "All actions" }));
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      eventName: undefined,
      globalFilter: "Ada",
    });
  });
});

const entry = (attributes: Record<string, string>): EventLogRecord => ({
  eventName: "task.updated",
  timeUnixNano: "1000000000",
  attributes: Object.entries(attributes).map(([key, stringValue]) => ({
    key,
    value: { stringValue },
  })),
});

describe("recorded audit user attributes", () => {
  it("displays the recorded full name and email without linking to Auth", () => {
    const record = entry({
      "app.actor.type": "user",
      "app.actor.id": "user-a",
      "user.id": "user-a",
      "user.full_name": "Ada Lovelace",
      "user.name": "ada",
      "user.email": "ada@example.test",
      "app.auth.impersonator.id": "admin-a",
      "app.audit.target.id": "course-a",
      "app.audit.target.name": "Recorded course",
    });
    const before = structuredClone(record);
    render(<AuditLogTable entries={[record]} rowCount={1} />);
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.test")).toBeTruthy();
    expect(screen.getByText("Recorded course")).toBeTruthy();
    expect(screen.getByText("Impersonated by: admin-a")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(record).toEqual(before);
  });

  it("supports standard user attributes without Auth-specific actor fields", () => {
    render(
      <AuditLogTable
        entries={[entry({ "user.id": "user-a", "user.name": "ada" })]}
        rowCount={1}
      />,
    );
    expect(screen.getByText("ada")).toBeTruthy();
    expect(screen.getByText("user-a")).toBeTruthy();
  });

  it("falls back to email when no name was recorded", () => {
    render(
      <AuditLogTable
        entries={[
          entry({ "user.id": "user-a", "user.email": "ada@example.test" }),
        ]}
        rowCount={1}
      />,
    );
    expect(screen.getByText("ada@example.test")).toBeTruthy();
  });

  it("retains neutral fallbacks for older events and organization actors", () => {
    render(
      <AuditLogTable
        entries={[
          entry({ "app.actor.type": "user", "app.actor.id": "missing-user" }),
          entry({
            "log.record.uid": "organization-event",
            "app.actor.type": "organization",
            "app.actor.id": "org-a",
            "user.full_name": "Not the organization",
          }),
        ]}
        rowCount={2}
      />,
    );
    expect(screen.getByText("Member")).toBeTruthy();
    expect(screen.getByText("missing-user")).toBeTruthy();
    expect(screen.getByText("Organization")).toBeTruthy();
    expect(screen.queryByText("Not the organization")).toBeNull();
  });
});
