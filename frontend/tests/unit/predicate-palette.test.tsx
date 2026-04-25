import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PredicatePalette } from "@/components/rules/predicate-palette";

describe("PredicatePalette", () => {
  it("renders all 26 predicates", () => {
    render(<PredicatePalette onInsert={() => {}} />);
    expect(screen.getByText(/Predicates \(26\)/)).toBeInTheDocument();
  });

  it("calls onInsert with predicate text when clicked", () => {
    const onInsert = vi.fn();
    render(<PredicatePalette onInsert={onInsert} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onInsert).toHaveBeenCalledOnce();
    expect(onInsert.mock.calls[0][0]).toContain("has_indicator");
  });

  it("renders predicate descriptions", () => {
    render(<PredicatePalette onInsert={() => {}} />);
    expect(screen.getByText(/Checks for a matching indicator IOC/)).toBeInTheDocument();
  });
});
