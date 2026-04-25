import { cn } from "@/lib/utils";

const TLP: Record<string, { label: string; bg: string; text: string }> = {
  RED: { label: "TLP:RED", bg: "bg-red-600", text: "text-white" },
  AMBER: { label: "TLP:AMBER", bg: "bg-amber-500", text: "text-white" },
  "AMBER+STRICT": { label: "TLP:AMBER+STRICT", bg: "bg-amber-600", text: "text-white" },
  GREEN: { label: "TLP:GREEN", bg: "bg-green-600", text: "text-white" },
  WHITE: { label: "TLP:WHITE", bg: "bg-gray-100", text: "text-gray-800" },
  CLEAR: { label: "TLP:CLEAR", bg: "bg-gray-100", text: "text-gray-800" },
};

export function TLPMarking({ tlp }: { tlp: string }) {
  const def = TLP[tlp.toUpperCase()] ?? TLP.WHITE;
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-bold", def.bg, def.text)}>
      {def.label}
    </span>
  );
}
