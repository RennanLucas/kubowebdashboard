import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { format, startOfMonth, endOfMonth, subMonths, differenceInCalendarDays } from "date-fns";

vi.mock("@/hooks/usePlan", () => ({ usePlan: () => ({ maxHistoryDays: 365, isFree: false }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));
afterEach(cleanup);

describe("date range picker contract", () => {
  it("emits both calendar boundaries when selecting last month", () => {
    const changed = vi.fn();
    render(<MemoryRouter><DateRangePicker dateRange={30} onDateRangeChange={changed} /></MemoryRouter>);
    fireEvent.click(screen.getByTestId("date-range-picker"));
    fireEvent.click(screen.getByRole("button", { name: "Mês passado" }));
    const month = subMonths(new Date(), 1);
    const start = startOfMonth(month), end = endOfMonth(month);
    expect(changed).toHaveBeenCalledWith(differenceInCalendarDays(end, start) + 1, {
      start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd"),
    });
  });
  it("clears absolute bounds when returning to a rolling preset", () => {
    const changed = vi.fn();
    render(<MemoryRouter><DateRangePicker dateRange={7} period={{ start: "2026-08-01", end: "2026-08-07" }} onDateRangeChange={changed} /></MemoryRouter>);
    expect(screen.getByTestId("date-range-picker")).toHaveTextContent("01/08/2026");
    fireEvent.click(screen.getByTestId("date-range-picker"));
    fireEvent.click(screen.getByRole("button", { name: "Últimos 30 dias" }));
    expect(changed).toHaveBeenCalledWith(30, undefined);
  });
});
