import { test, expect, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

describe("getToolLabel", () => {
  describe("str_replace_editor", () => {
    test("create with path returns Creating <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "src/App.jsx" })).toBe("Creating App.jsx");
    });

    test("create without path returns fallback", () => {
      expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
    });

    test("str_replace with path returns Editing <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/Button.tsx" })).toBe("Editing Button.tsx");
    });

    test("insert with path returns Editing <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/utils.ts" })).toBe("Editing utils.ts");
    });

    test("view with path returns Reading <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "src/index.ts" })).toBe("Reading index.ts");
    });

    test("view without path returns fallback", () => {
      expect(getToolLabel("str_replace_editor", { command: "view" })).toBe("Reading file");
    });

    test("undo_edit with path returns Undoing changes in <filename>", () => {
      expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "src/App.jsx" })).toBe("Undoing changes in App.jsx");
    });

    test("undo_edit without path returns fallback", () => {
      expect(getToolLabel("str_replace_editor", { command: "undo_edit" })).toBe("Undoing changes");
    });

    test("unknown command falls through to raw tool name", () => {
      expect(getToolLabel("str_replace_editor", { command: "unknown" })).toBe("str_replace_editor");
    });
  });

  describe("file_manager", () => {
    test("rename with new_path returns Renaming to <filename>", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "old.jsx", new_path: "src/New.jsx" })).toBe("Renaming to New.jsx");
    });

    test("rename without new_path returns fallback", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "old.jsx" })).toBe("Renaming file");
    });

    test("delete with path returns Deleting <filename>", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "src/Old.jsx" })).toBe("Deleting Old.jsx");
    });

    test("delete without path returns fallback", () => {
      expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
    });
  });

  test("unknown tool name returns the raw tool name", () => {
    expect(getToolLabel("some_other_tool", { command: "foo" })).toBe("some_other_tool");
  });

  test("nested path uses only the filename", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "a/b/c/deep.tsx" })).toBe("Creating deep.tsx");
  });
});

// --- ToolInvocationBadge component tests ---

describe("ToolInvocationBadge", () => {
  test("shows spinner and label when in-progress", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "App.jsx" }}
        state="call"
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    // Spinner should be present (Loader2 renders an svg)
    expect(document.querySelector("svg")).not.toBeNull();
  });

  test("shows green dot and label when done", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "App.jsx" }}
        state="result"
        result={{ success: true }}
      />
    );
    expect(screen.getByText("Creating App.jsx")).toBeDefined();
    // Green dot is a plain div, no svg
    expect(document.querySelector("svg")).toBeNull();
  });

  test("treats missing result as in-progress even if state is result", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "view", path: "App.jsx" }}
        state="result"
        result={undefined}
      />
    );
    expect(screen.getByText("Reading App.jsx")).toBeDefined();
    expect(document.querySelector("svg")).not.toBeNull();
  });

  test("falls back to raw tool name for unknown tools", () => {
    render(
      <ToolInvocationBadge
        toolName="mystery_tool"
        args={{}}
        state="call"
      />
    );
    expect(screen.getByText("mystery_tool")).toBeDefined();
  });

  test("renders file_manager delete label", () => {
    render(
      <ToolInvocationBadge
        toolName="file_manager"
        args={{ command: "delete", path: "src/Old.jsx" }}
        state="result"
        result={{ success: true }}
      />
    );
    expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
  });
});
