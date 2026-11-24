import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { runDailyScheduler } from "@/lib/jobs/daily-scheduler";

export async function POST(request: Request) {
  try {
    const cronHeader = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;
    const session = await getServerSession();

    const authorizedBySecret = Boolean(expectedSecret && cronHeader === expectedSecret);
    const authorizedByManager = session.role === "MANAGER";

    if (!authorizedBySecret && !authorizedByManager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const summary = await runDailyScheduler(new Date());
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler execution failed" },
      { status: 500 }
    );
  }
}
