"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Grid3X3, Layers, User, FileText, Wrench, CreditCard } from "lucide-react";
import { UNIT_VISUAL_STATES, type UnitVisualStateKey } from "@/lib/tokens";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export interface ExplorerUnit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  targetRent: number;
  visualState: UnitVisualStateKey;
  activeLease: {
    id: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    monthlyRent: number;
    startDate: string;
    endDate: string;
    status: string;
    outstandingBalance: number;
  } | null;
  openMaintenance: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
  }>;
}

export interface ExplorerFloor {
  id: string;
  floorNumber: number;
  label: string;
  units: ExplorerUnit[];
}

export interface ExplorerBuilding {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  name: string;
  code: string;
  hasPhysicalPlan: boolean;
  architectureNotes: string | null;
  floors: ExplorerFloor[];
}

interface BuildingExplorerProps {
  buildings: ExplorerBuilding[];
  initialPropertyId?: string;
}

export function BuildingExplorer({
  buildings,
  initialPropertyId,
}: BuildingExplorerProps) {
  const defaultBuilding =
    buildings.find((b) => b.propertyId === initialPropertyId) ?? buildings[0];

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    defaultBuilding?.id ?? ""
  );
  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) ?? buildings[0],
    [buildings, selectedBuildingId]
  );

  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"AUTO" | "GRID">("AUTO");

  const allUnits = useMemo(
    () => selectedBuilding?.floors.flatMap((f) => f.units) ?? [],
    [selectedBuilding]
  );

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    allUnits[0]?.id ?? ""
  );

  const selectedUnit =
    allUnits.find((u) => u.id === selectedUnitId) ?? allUnits[0] ?? null;

  if (!selectedBuilding) {
    return (
      <div className="border border-[#C5A88A] bg-[#FAF5EE] p-8 text-sm text-[#5A5C56]">
        No buildings found in portfolio.
      </div>
    );
  }

  const useAbstractGrid = viewMode === "GRID" || !selectedBuilding.hasPhysicalPlan;
  const sortedFloorsDesc = [...selectedBuilding.floors].sort(
    (a, b) => b.floorNumber - a.floorNumber
  );

  // SVG layout dimensions
  const maxUnitsOnFloor = Math.max(
    1,
    ...sortedFloorsDesc.map((f) => f.units.length)
  );
  const svgWidth = 760;
  const roofHeight = 44;
  const floorHeight = 96;
  const plinthHeight = 36;
  const svgHeight = roofHeight + sortedFloorsDesc.length * floorHeight + plinthHeight;
  const leftMargin = 110;
  const rightMargin = 28;
  const usableWidth = svgWidth - leftMargin - rightMargin;

  return (
    <div className="space-y-8">
      {/* Header & Building Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#C5A88A] pb-5">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-[#262824]">
            Building Explorer
          </h1>
          <p className="text-sm text-[#5A5C56] mt-2">
            Select a floor and unit to inspect resident occupancy, lease
            expiration, rent balance, and active maintenance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {buildings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBuildingId(b.id);
                setSelectedFloorNumber(null);
                const firstUnit = b.floors[0]?.units[0];
                if (firstUnit) setSelectedUnitId(firstUnit.id);
              }}
              className={cn(
                "px-3.5 py-2 text-xs font-medium border transition-colors cursor-pointer",
                b.id === selectedBuilding.id
                  ? "border-[#262824] bg-[#262824] text-[#FAF5EE]"
                  : "border-[#C5A88A] bg-[#FAF5EE] text-[#262824] hover:bg-[#EDE0D0]"
              )}
            >
              {b.propertyName}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & View Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-[#C5A88A] bg-[#FAF5EE] px-4 py-3">
        <div className="flex flex-wrap items-center gap-5 text-xs">
          {(Object.keys(UNIT_VISUAL_STATES) as UnitVisualStateKey[]).map((key) => {
            const state = UNIT_VISUAL_STATES[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 border"
                  style={{
                    backgroundColor: state.fill,
                    borderColor: state.stroke,
                  }}
                />
                <span className="text-[#262824] font-medium">{state.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#5A5C56] font-mono-num">
            {selectedBuilding.code}
            {!selectedBuilding.hasPhysicalPlan && " · No physical CAD plan"}
          </span>
          {selectedBuilding.hasPhysicalPlan && (
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === "AUTO" ? "GRID" : "AUTO"))}
              className="inline-flex items-center gap-1.5 border border-[#C5A88A] px-2.5 py-1 hover:bg-[#F5EBDF] cursor-pointer"
            >
              {useAbstractGrid ? (
                <>
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Elevation View</span>
                </>
              ) : (
                <>
                  <Grid3X3 className="h-3.5 w-3.5" />
                  <span>Abstract Grid</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Interactive Diagram + Detail Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 border border-[#C5A88A] bg-[#FAF5EE] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-[#262824]">
                {selectedBuilding.name}
              </h2>
              <p className="text-xs text-[#5A5C56]">
                {selectedBuilding.propertyAddress}
                {selectedBuilding.architectureNotes
                  ? ` — ${selectedBuilding.architectureNotes}`
                  : ""}
              </p>
            </div>
            {selectedFloorNumber !== null && (
              <button
                type="button"
                onClick={() => setSelectedFloorNumber(null)}
                className="text-xs text-[#8C4A3D] underline cursor-pointer"
              >
                Show all floors
              </button>
            )}
          </div>

          {/* Floor filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-5">
            <span className="inline-flex items-center gap-1 text-xs text-[#5A5C56] mr-2">
              <Layers className="h-3.5 w-3.5" />
              Floors:
            </span>
            {sortedFloorsDesc.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  setSelectedFloorNumber((prev) =>
                    prev === f.floorNumber ? null : f.floorNumber
                  )
                }
                className={cn(
                  "px-2.5 py-1 font-mono-num text-xs border cursor-pointer transition-colors",
                  selectedFloorNumber === f.floorNumber
                    ? "border-[#8C4A3D] bg-[#8C4A3D] text-[#FAF5EE]"
                    : "border-[#C5A88A] bg-[#F5EBDF] text-[#262824]"
                )}
              >
                F{f.floorNumber}
              </button>
            ))}
          </div>

          {useAbstractGrid ? (
            /* Abstract Unit Grid (for buildings without physical floor plans) */
            <div className="space-y-4 bg-architectural-grid p-4 border border-[#C5A88A]/60">
              {sortedFloorsDesc
                .filter(
                  (f) =>
                    selectedFloorNumber === null ||
                    f.floorNumber === selectedFloorNumber
                )
                .map((floor) => (
                  <div key={floor.id} className="space-y-2">
                    <p className="font-mono-num text-xs text-[#5A5C56]">
                      {floor.label}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {floor.units.map((unit) => {
                        const style = UNIT_VISUAL_STATES[unit.visualState];
                        const isSelected = unit.id === selectedUnit?.id;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={cn(
                              "p-3 text-left border transition-transform cursor-pointer",
                              isSelected && "ring-2 ring-[#262824] ring-offset-2 ring-offset-[#FAF5EE]"
                            )}
                            style={{
                              backgroundColor: style.fill,
                              borderColor: style.stroke,
                              color: style.text,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono-num text-sm font-semibold">
                                {unit.unitNumber}
                              </span>
                              <span className="font-mono-num text-[10px] opacity-85">
                                {unit.bedrooms}BR
                              </span>
                            </div>
                            <p className="text-[11px] mt-1 truncate opacity-90">
                              {unit.activeLease?.tenantName ?? style.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* Signature Interactive SVG Building Elevation */
            <div className="w-full overflow-x-auto bg-architectural-grid border border-[#C5A88A]/60 p-3">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[560px] h-auto select-none"
                role="img"
                aria-label={`${selectedBuilding.name} architectural elevation`}
              >
                {/* Architectural Cornice / Parapet */}
                <rect
                  x={leftMargin - 8}
                  y={16}
                  width={usableWidth + 16}
                  height={18}
                  fill="#262824"
                />
                <line
                  x1={leftMargin - 14}
                  y1={34}
                  x2={leftMargin + usableWidth + 14}
                  y2={34}
                  stroke="#C5A88A"
                  strokeWidth={2}
                />

                {sortedFloorsDesc.map((floor, floorIdx) => {
                  const yTop = roofHeight + floorIdx * floorHeight;
                  const dimmed =
                    selectedFloorNumber !== null &&
                    selectedFloorNumber !== floor.floorNumber;
                  const unitGap = 12;
                  const unitWidth =
                    (usableWidth - unitGap * (maxUnitsOnFloor + 1)) /
                    maxUnitsOnFloor;

                  return (
                    <g
                      key={floor.id}
                      style={{ opacity: dimmed ? 0.32 : 1, transition: "opacity 200ms ease" }}
                    >
                      {/* Floor Label (clickable) */}
                      <g
                        onClick={() =>
                          setSelectedFloorNumber((prev) =>
                            prev === floor.floorNumber ? null : floor.floorNumber
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <text
                          x={16}
                          y={yTop + 44}
                          fill="#262824"
                          fontSize="12"
                          fontFamily="var(--font-mono), monospace"
                          fontWeight="600"
                        >
                          FLOOR {String(floor.floorNumber).padStart(2, "0")}
                        </text>
                        <text
                          x={16}
                          y={yTop + 60}
                          fill="#5A5C56"
                          fontSize="10"
                          fontFamily="var(--font-sans), sans-serif"
                        >
                          {floor.units.length} units
                        </text>
                        <line
                          x1={16}
                          y1={yTop + floorHeight - 4}
                          x2={leftMargin - 12}
                          y2={yTop + floorHeight - 4}
                          stroke="#C5A88A"
                          strokeDasharray="3 3"
                        />
                      </g>

                      {/* Structural Building Facade Band */}
                      <rect
                        x={leftMargin}
                        y={yTop}
                        width={usableWidth}
                        height={floorHeight - 6}
                        fill="#EDE0D0"
                        stroke="#C5A88A"
                        strokeWidth={1.2}
                      />

                      {/* Units on Floor */}
                      {floor.units.map((unit, uIdx) => {
                        const ux = leftMargin + unitGap + uIdx * (unitWidth + unitGap);
                        const uy = yTop + 10;
                        const uh = floorHeight - 26;
                        const style = UNIT_VISUAL_STATES[unit.visualState];
                        const isSelected = unit.id === selectedUnit?.id;

                        return (
                          <g
                            key={unit.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Unit ${unit.unitNumber}, ${style.label}`}
                            onClick={() => setSelectedUnitId(unit.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedUnitId(unit.id);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <rect
                              x={ux}
                              y={uy}
                              width={unitWidth}
                              height={uh}
                              fill={style.fill}
                              stroke={isSelected ? "#262824" : style.stroke}
                              strokeWidth={isSelected ? 3 : 1.5}
                              strokeDasharray={
                                unit.visualState === "VACANT" && !isSelected
                                  ? "4 3"
                                  : undefined
                              }
                            />
                            {/* Architectural Window Mullion */}
                            <line
                              x1={ux + unitWidth / 2}
                              y1={uy + 6}
                              x2={ux + unitWidth / 2}
                              y2={uy + uh - 26}
                              stroke={style.text}
                              strokeOpacity={0.22}
                              strokeWidth={1}
                            />
                            <text
                              x={ux + 10}
                              y={uy + 22}
                              fill={style.text}
                              fontSize="13"
                              fontFamily="var(--font-mono), monospace"
                              fontWeight="600"
                            >
                              {unit.unitNumber}
                            </text>
                            <text
                              x={ux + unitWidth - 10}
                              y={uy + 22}
                              textAnchor="end"
                              fill={style.text}
                              fontSize="10"
                              fontFamily="var(--font-mono), monospace"
                              opacity={0.85}
                            >
                              {unit.bedrooms}BR
                            </text>
                            <text
                              x={ux + 10}
                              y={uy + uh - 10}
                              fill={style.text}
                              fontSize="10"
                              fontFamily="var(--font-sans), sans-serif"
                              opacity={0.92}
                            >
                              {unit.activeLease
                                ? unit.activeLease.tenantName.split(" ")[0]
                                : style.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* Ground Plinth */}
                <rect
                  x={leftMargin - 12}
                  y={svgHeight - plinthHeight + 4}
                  width={usableWidth + 24}
                  height={16}
                  fill="#262824"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Unit Inspection Detail Panel */}
        <aside className="xl:col-span-4 border border-[#C5A88A] bg-[#FAF5EE] p-6 space-y-6">
          {selectedUnit ? (
            <>
              <div className="flex items-start justify-between border-b border-[#C5A88A]/60 pb-4">
                <div>
                  <p className="font-mono-num text-xs uppercase tracking-wider text-[#5A5C56]">
                    Unit Inspection
                  </p>
                  <h3 className="font-display text-3xl text-[#262824] mt-0.5">
                    Unit {selectedUnit.unitNumber}
                  </h3>
                  <p className="font-mono-num text-xs text-[#5A5C56] mt-1">
                    {selectedUnit.bedrooms} BR · {selectedUnit.bathrooms} BA ·{" "}
                    {selectedUnit.areaSqFt.toLocaleString()} sq ft
                  </p>
                </div>
                <span
                  className="px-2.5 py-1 text-[11px] font-medium border"
                  style={{
                    backgroundColor: UNIT_VISUAL_STATES[selectedUnit.visualState].fill,
                    color: UNIT_VISUAL_STATES[selectedUnit.visualState].text,
                    borderColor: UNIT_VISUAL_STATES[selectedUnit.visualState].stroke,
                  }}
                >
                  {UNIT_VISUAL_STATES[selectedUnit.visualState].label}
                </span>
              </div>

              {/* Tenant & Lease Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#5A5C56]">
                  <User className="h-3.5 w-3.5" />
                  <span>Resident &amp; Lease</span>
                </div>
                {selectedUnit.activeLease ? (
                  <div className="border border-[#C5A88A]/70 bg-[#F5EBDF] p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#262824]">
                        {selectedUnit.activeLease.tenantName}
                      </span>
                      <span className="font-mono-num text-xs text-[#6F795E]">
                        {selectedUnit.activeLease.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A5C56]">
                      {selectedUnit.activeLease.tenantEmail}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#C5A88A]/50 text-xs">
                      <div>
                        <span className="text-[#5A5C56] block">Monthly Rent</span>
                        <span className="font-mono-num font-medium">
                          {formatCurrency(selectedUnit.activeLease.monthlyRent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5A5C56] block">Outstanding</span>
                        <span
                          className={cn(
                            "font-mono-num font-medium",
                            selectedUnit.activeLease.outstandingBalance > 0
                              ? "text-[#8C4A3D]"
                              : "text-[#6F795E]"
                          )}
                        >
                          {formatCurrency(selectedUnit.activeLease.outstandingBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5A5C56] block">Lease Start</span>
                        <span className="font-mono-num">
                          {formatDate(selectedUnit.activeLease.startDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5A5C56] block">Lease End</span>
                        <span className="font-mono-num">
                          {formatDate(selectedUnit.activeLease.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#C5A88A] p-4 text-xs text-[#5A5C56] space-y-2">
                    <p>
                      No active lease assigned. Target rent:{" "}
                      <span className="font-mono-num font-medium text-[#262824]">
                        {formatCurrency(selectedUnit.targetRent)}/mo
                      </span>
                    </p>
                    <Link
                      href="/leases"
                      className="inline-flex items-center gap-1.5 text-[#8C4A3D] font-medium hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Create Lease for Unit {selectedUnit.unitNumber}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Maintenance Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-[#5A5C56]">
                  <span className="inline-flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Open Maintenance ({selectedUnit.openMaintenance.length})</span>
                  </span>
                  <Link href="/maintenance" className="text-[#8C4A3D] hover:underline">
                    Manage
                  </Link>
                </div>
                {selectedUnit.openMaintenance.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedUnit.openMaintenance.map((m) => (
                      <li
                        key={m.id}
                        className="border border-[#C5A88A]/70 bg-[#F5EBDF] p-3 text-xs flex items-center justify-between gap-2"
                      >
                        <span className="font-medium text-[#262824]">{m.title}</span>
                        <span className="font-mono-num text-[10px] px-2 py-0.5 bg-[#8C4A3D] text-[#FAF5EE]">
                          {m.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#5A5C56]">
                    No open maintenance requests for this unit.
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-[#C5A88A]/60 grid grid-cols-2 gap-2">
                <Link
                  href="/payments"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#262824] text-[#FAF5EE] px-3 py-2 text-xs font-medium hover:bg-[#3A3D37]"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Rent Ledger</span>
                </Link>
                <Link
                  href="/maintenance"
                  className="inline-flex items-center justify-center gap-1.5 border border-[#C5A88A] px-3 py-2 text-xs font-medium hover:bg-[#F5EBDF]"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Log Ticket</span>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5A5C56]">Select a unit to inspect.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
