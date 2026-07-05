import { Link } from "@tanstack/react-router";

export function InvestigationsIndex() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Investigations</h1>
        <Link
          to="/investigations/new"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          New Investigation
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Select New Investigation to pick a seed and build an evidence graph.
      </p>
    </div>
  );
}
