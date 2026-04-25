import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SeedPicker } from "@/components/investigations/seed-picker";

export const Route = createFileRoute("/investigations/new")({
  component: NewInvestigationPage,
});

function NewInvestigationPage() {
  const navigate = useNavigate();
  return (
    <SeedPicker
      onComplete={(id) => navigate({ to: "/investigations/$id", params: { id } })}
    />
  );
}
