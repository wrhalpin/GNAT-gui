import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useRule, useUpdateRule, usePromoteRule } from "@/api/queries/rules";
import { RuleEditor } from "@/components/rules/rule-editor";
import { PredicatePalette } from "@/components/rules/predicate-palette";
import { TestRunnerPanel } from "@/components/rules/test-runner-panel";
import { AuditTrail } from "@/components/rules/audit-trail";
import { usePermission } from "@/lib/rbac";

export const Route = createFileRoute("/rules/$id")({
  component: RuleDetailPage,
});

type Tab = "editor" | "test" | "audit";

function RuleDetailPage() {
  const { id } = Route.useParams();
  const { data: rule, isLoading } = useRule(id);
  const update = useUpdateRule(id);
  const promote = usePromoteRule(id);
  const canPublish = usePermission("rule.publish");
  const [tab, setTab] = useState<Tab>("editor");
  const insertRef = useRef<((text: string) => void) | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!rule) return <p className="text-sm text-destructive">Rule not found</p>;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{rule.name}</h1>
        <div className="flex gap-2">
          {canPublish && rule.scope !== "shared" && (
            <button
              onClick={() => promote.mutate()}
              className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
            >
              Promote to Shared
            </button>
          )}
          <button
            onClick={() => update.mutate({ content: rule.content } as any)}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(["editor", "test", "audit"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm capitalize ${tab === t ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "editor" && (
        <div className="flex flex-1 gap-3 overflow-hidden">
          <div className="flex-1 overflow-hidden rounded border">
            <RuleEditor
              rule={rule}
              onChange={(content) => update.mutate({ content } as any)}
              onInsertText={(fn) => { insertRef.current = fn; }}
            />
          </div>
          <div className="w-64 overflow-hidden">
            <PredicatePalette onInsert={(text) => insertRef.current?.(text)} />
          </div>
        </div>
      )}

      {tab === "test" && (
        <div className="flex-1 overflow-auto">
          <TestRunnerPanel ruleId={id} />
        </div>
      )}

      {tab === "audit" && (
        <div className="flex-1 overflow-auto">
          <AuditTrail ruleId={id} />
        </div>
      )}
    </div>
  );
}
