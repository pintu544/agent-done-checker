import { getCheckReport } from "@/lib/check-reports";

export async function GET(_request: Request, { params }: RouteContext<"/api/checks/[id]">) {
  const { id } = await params;
  const report = await getCheckReport(id, true);
  return report
    ? Response.json(report)
    : Response.json({ error: "Check not found." }, { status: 404 });
}
