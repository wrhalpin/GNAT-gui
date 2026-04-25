import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EdgeFilter, type EdgeFilterState } from "@/components/investigations/edge-filter";

const defaultFilter: EdgeFilterState = {
  types: new Set(["uses", "indicates"]),
  minConfidence: 0,
};

describe("EdgeFilter", () => {
  it("renders provided edge types", () => {
    render(<EdgeFilter allTypes={["uses", "indicates"]} value={defaultFilter} onChange={() => {}} />);
    expect(screen.getByText("uses")).toBeInTheDocument();
    expect(screen.getByText("indicates")).toBeInTheDocument();
  });

  it("calls onChange when a type is toggled", () => {
    const onChange = vi.fn();
    render(<EdgeFilter allTypes={["uses", "indicates"]} value={defaultFilter} onChange={onChange} />);
    fireEvent.click(screen.getByText("uses"));
    expect(onChange).toHaveBeenCalledOnce();
    const [newState] = onChange.mock.calls[0];
    expect(newState.types.has("uses")).toBe(false);
  });

  it("falls back to default edge types when allTypes is empty", () => {
    render(<EdgeFilter allTypes={[]} value={defaultFilter} onChange={() => {}} />);
    expect(screen.getByText("uses")).toBeInTheDocument();
  });
});
