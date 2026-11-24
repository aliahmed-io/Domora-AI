import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
import {
  BuildingExplorer,
  type ExplorerBuilding,
} from "@/components/building-explorer";

const MOCK_BUILDINGS: ExplorerBuilding[] = [
  {
    id: "b1",
    propertyId: "p1",
    propertyName: "The Courtyard Residence",
    propertyAddress: "418 Travertine Way",
    name: "Main Pavilion",
    code: "CRP-A",
    hasPhysicalPlan: true,
    architectureNotes: "Travertine elevation",
    floors: [
      {
        id: "f1",
        floorNumber: 1,
        label: "Floor 1",
        units: [
          {
            id: "u101",
            unitNumber: "101",
            bedrooms: 2,
            bathrooms: 2,
            areaSqFt: 1120,
            targetRent: 2800,
            visualState: "OCCUPIED",
            activeLease: {
              id: "l1",
              tenantId: "t1",
              tenantName: "Elena Vance",
              tenantEmail: "elena.vance@domora.demo",
              monthlyRent: 2800,
              startDate: "2026-01-01T00:00:00.000Z",
              endDate: "2027-01-01T00:00:00.000Z",
              status: "ACTIVE",
              outstandingBalance: 0,
            },
            openMaintenance: [],
          },
          {
            id: "u102",
            unitNumber: "102",
            bedrooms: 1,
            bathrooms: 1,
            areaSqFt: 840,
            targetRent: 2300,
            visualState: "VACANT",
            activeLease: null,
            openMaintenance: [],
          },
        ],
      },
    ],
  },
];

describe("BuildingExplorer", () => {
  it("renders SVG elevation and updates inspection panel when clicking a unit", () => {
    render(<BuildingExplorer buildings={MOCK_BUILDINGS} />);

    expect(screen.getByText("Unit 101")).toBeInTheDocument();
    expect(screen.getByText("Elena Vance")).toBeInTheDocument();

    const unit102Button = screen.getByRole("button", {
      name: /Unit 102, Vacant/i,
    });
    fireEvent.click(unit102Button);

    expect(screen.getByText("Unit 102")).toBeInTheDocument();
    expect(screen.getByText(/No active lease assigned/i)).toBeInTheDocument();
  });
});
