import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConfidenceBadge } from "@/components/analysis/confidence-badge";

describe("ConfidenceBadge", () => {
  it("renders source reliability label", () => {
    render(<ConfidenceBadge source="A" information="1" />);
    expect(screen.getByText(/Completely reliable/)).toBeInTheDocument();
  });

  it("renders information credibility label", () => {
    render(<ConfidenceBadge source="B" information="2" />);
    expect(screen.getByText(/Probably true/)).toBeInTheDocument();
  });

  it("renders numeric confidence percentage when provided", () => {
    render(<ConfidenceBadge source="A" information="1" confidence={0.85} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("renders unknown source gracefully", () => {
    render(<ConfidenceBadge source="Z" information="9" />);
    // Should not throw; unknown codes are just omitted
  });
});
