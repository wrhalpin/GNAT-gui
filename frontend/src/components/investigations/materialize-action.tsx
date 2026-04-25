import { useState } from "react";
import { useMaterialize } from "@/api/queries/investigations";
import { usePermission } from "@/lib/rbac";

export function MaterializeAction({ investigationId }: { investigationId: string }) {
  const [confirm, setConfirm] = useState(false);
  const canMaterialize = usePermission("investigation.materialize");
  const materialize = useMaterialize(investigationId);

  if (!canMaterialize) return null;

  return (
    <div>
      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          Materialize to Workspace
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Persist this graph to a GNAT workspace as STIX?
          </p>
          <button
            onClick={() => { materialize.mutate(); setConfirm(false); }}
            disabled={materialize.isPending}
            className="rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Confirm
          </button>
          <button onClick={() => setConfirm(false)} className="text-sm text-muted-foreground">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
