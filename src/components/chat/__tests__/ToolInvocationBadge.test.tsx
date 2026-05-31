import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

describe("getToolLabel", () => {
  it("returns Creating <filename> for str_replace_editor create", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "create", path: "/components/Card.jsx" })
    ).toBe("Creating Card.jsx");
  });

  it("returns Editing <filename> for str_replace_editor str_replace", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" })
    ).toBe("Editing App.jsx");
  });

  it("returns Editing <filename> for str_replace_editor insert", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })
    ).toBe("Editing App.jsx");
  });

  it("returns Reading <filename> for str_replace_editor view", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "view", path: "/components/Button.tsx" })
    ).toBe("Reading Button.tsx");
  });

  it("returns Renaming <filename> for file_manager rename", () => {
    expect(
      getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })
    ).toBe("Renaming old.jsx");
  });

  it("returns Deleting <filename> for file_manager delete", () => {
    expect(
      getToolLabel("file_manager", { command: "delete", path: "/components/Card.jsx" })
    ).toBe("Deleting Card.jsx");
  });

  it("extracts filename from nested path", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "create", path: "/src/components/ui/Button.tsx" })
    ).toBe("Creating Button.tsx");
  });

  it("falls back to toolName for unknown tool", () => {
    expect(getToolLabel("unknown_tool", {})).toBe("unknown_tool");
  });

  it("falls back to toolName for unknown command", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })
    ).toBe("str_replace_editor");
  });
});

describe("ToolInvocationBadge", () => {
  it("shows user-friendly label from tool args", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/components/Button.tsx" },
          state: "call",
        }}
      />
    );
    expect(screen.getByText("Creating Button.tsx")).toBeDefined();
  });

  it("shows spinner while pending", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });

  it("shows green dot when result is present", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "File created: /App.jsx",
        }}
      />
    );
    expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("shows spinner when state is result but result is null", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: null,
        }}
      />
    );
    expect(container.querySelector(".animate-spin")).not.toBeNull();
  });
});
