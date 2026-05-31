"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: unknown;
  state: string;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function getToolLabel(toolName: string, args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  const path = typeof a.path === "string" ? a.path : "";
  const filename = path.split("/").filter(Boolean).pop() ?? path;

  if (toolName === "str_replace_editor") {
    switch (a.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (a.command) {
      case "rename":
        return `Renaming ${filename}`;
      case "delete":
        return `Deleting ${filename}`;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isDone = state === "result" && result != null;
  const label = getToolLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
