import { NextResponse } from "next/server";
import { AuthorizationError, requireManagerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertyCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireManagerSession();

    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        buildings: {
          include: {
            units: {
              include: {
                leases: {
                  where: { status: { in: ["ACTIVE", "EXPIRING_SOON"] } },
                  include: {
                    obligations: true,
                  },
                },
                maintenanceRequests: {
                  where: { status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
                },
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    const enriched = properties.map((p) => {
      const units = p.buildings.flatMap((b) => b.units);
      const totalUnits = units.length;
      const occupiedUnits = units.filter((u) => u.status === "OCCUPIED").length;
      const vacantUnits = units.filter((u) => u.status === "VACANT").length;
      const openMaintenance = units.reduce(
        (sum, u) => sum + u.maintenanceRequests.length,
        0
      );

      let monthlyScheduledRent = 0;
      let collectedRent = 0;
      let overdueAmount = 0;

      for (const u of units) {
        for (const lease of u.leases) {
          monthlyScheduledRent += lease.monthlyRent;
          for (const ob of lease.obligations) {
            if (ob.periodYear === currentYear && ob.periodMonth === currentMonth) {
              collectedRent += ob.amountPaid;
            }
            if (ob.status === "OVERDUE") {
              overdueAmount += Math.max(0, ob.amountDue - ob.amountPaid);
            }
          }
        }
      }

      return {
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        postalCode: p.postalCode,
        propertyType: p.propertyType,
        imageUrl: p.imageUrl,
        archivedAt: p.archivedAt,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        monthlyScheduledRent,
        collectedRent,
        overdueAmount,
        openMaintenance,
      };
    });

    return NextResponse.json({ properties: enriched });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireManagerSession();
    const body = await request.json();
    const parsed = propertyCreateSchema.parse(body);

    const totalFloors = parsed.totalFloors ?? 2;
    const unitsPerFloor = parsed.unitsPerFloor ?? 4;

    const created = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          name: parsed.name,
          address: parsed.address,
          city: parsed.city,
          state: parsed.state,
          postalCode: parsed.postalCode,
          propertyType: parsed.propertyType,
          imageUrl: parsed.imageUrl ?? "/images/courtyard-residence.jpg",
        },
      });

      const building = await tx.building.create({
        data: {
          propertyId: property.id,
          name: parsed.buildingName ?? `${parsed.name} — Main`,
          code: `BLD-${property.id.slice(-4).toUpperCase()}`,
          totalFloors,
          hasPhysicalPlan: parsed.hasPhysicalPlan ?? true,
        },
      });

      for (let f = 1; f <= totalFloors; f++) {
        const floor = await tx.floor.create({
          data: {
            buildingId: building.id,
            floorNumber: f,
            label: `Floor ${f}`,
          },
        });

        for (let u = 1; u <= unitsPerFloor; u++) {
          await tx.unit.create({
            data: {
              floorId: floor.id,
              buildingId: building.id,
              unitNumber: `${f}0${u}`,
              bedrooms: u % 2 === 0 ? 2 : 1,
              bathrooms: u % 2 === 0 ? 2 : 1,
              areaSqFt: 850 + u * 120,
              targetRent: 2200 + f * 150,
              status: "VACANT",
              gridRow: f,
              gridCol: u,
            },
          });
        }
      }

      return property;
    });

    return NextResponse.json({ property: created }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create property" },
      { status: 400 }
    );
  }
}
