// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach } from "vitest";
import type { EventLogRecord, EventQuery } from "../schema";
import { AuditLogTable } from "./audit-log-table";

afterEach(cleanup);

describe("server event-name filter", () => {
  it("resets the page, preserves shared action filters during search, and supports clearing", async () => {
    const changes: EventQuery[] = [];
    const ControlledTable = () => {
      const [state, setState] = useState<EventQuery>({ page: 2, pageSize: 20 });
      return (
        <AuditLogTable
          entries={[]}
          events={[
            { value: "task.updated", label: "Task updated" },
            { value: "task.created", label: "Task created" },
          ]}
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
    fireEvent.click(screen.getByRole("menuitem", { name: "Filters" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Action" }));
    fireEvent.click(
      await screen.findByRole("menuitemcheckbox", { name: "Task updated" }),
    );
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      pageSize: 20,
      filters: [{ id: "eventName", kind: "values", values: ["task.updated"] }],
    });
    fireEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Task created" }),
    );
    expect(changes.at(-1)?.filters).toEqual([
      {
        id: "eventName",
        kind: "values",
        values: ["task.updated", "task.created"],
      },
    ]);
    fireEvent.keyDown(
      screen.getByRole("menuitemcheckbox", { name: "Task created" }),
      { key: "Escape" },
    );
    fireEvent.change(screen.getByPlaceholderText("Filter results..."), {
      target: { value: "Ada" },
    });
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      filters: [
        {
          id: "eventName",
          kind: "values",
          values: ["task.updated", "task.created"],
        },
      ],
      globalFilter: "Ada",
    });
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Clear all filters" }),
    );
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      eventName: undefined,
      filters: undefined,
      globalFilter: "Ada",
    });
  });
  it("exposes old event-name links as selected shared filters", async () => {
    render(
      <AuditLogTable
        entries={[]}
        events={[{ value: "task.updated", label: "Task updated" }]}
        rowCount={0}
        state={{ page: 0, pageSize: 20, eventName: "task.updated" }}
        onStateChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Filters" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Action" }));
    expect(
      (
        await screen.findByRole("menuitemcheckbox", { name: "Task updated" })
      ).getAttribute("aria-checked"),
    ).toBe("true");
  });
  it("offers every supported server column and sends stable method values", async () => {
    const changes: EventQuery[] = [];
    render(
      <AuditLogTable
        entries={[]}
        rowCount={0}
        state={{ page: 3, pageSize: 20 }}
        onStateChange={(next) => changes.push(next)}
      />,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Filters" }));
    for (const name of ["Time", "Action", "Target", "Actor", "Method"]) {
      expect(await screen.findByRole("menuitem", { name })).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("menuitem", { name: "Method" }));
    fireEvent.click(
      await screen.findByRole("menuitemcheckbox", { name: "User session" }),
    );
    expect(changes.at(-1)).toMatchObject({
      page: 0,
      filters: [{ id: "method", kind: "values", values: ["session"] }],
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
