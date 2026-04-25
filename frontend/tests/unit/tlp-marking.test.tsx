import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TLPMarking } from "@/components/analysis/tlp-marking";

describe("TLPMarking", () => {
  it("renders TLP:RED", () => {
    render(<TLPMarking tlp="RED" />);
    expect(screen.getByText("TLP:RED")).toBeInTheDocument();
  });

  it("renders TLP:AMBER", () => {
    render(<TLPMarking tlp="AMBER" />);
    expect(screen.getByText("TLP:AMBER")).toBeInTheDocument();
  });

  it("is case insensitive", () => {
    render(<TLPMarking tlp="green" />);
    expect(screen.getByText("TLP:GREEN")).toBeInTheDocument();
  });

  it("falls back to TLP:WHITE for unknown values", () => {
    render(<TLPMarking tlp="UNKNOWN" />);
    expect(screen.getByText("TLP:WHITE")).toBeInTheDocument();
  });
});
