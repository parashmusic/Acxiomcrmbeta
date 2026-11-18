import { requireAuthUser } from "@/lib/auth/session";
import { getOpportunityById } from "@/services/opportunity.service";
import { can } from "@/lib/rbac";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Building,
  Calendar,
  IndianRupee,
  Percent,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { OpportunityStage, OpportunityStatus } from "@prisma/client";
import { updateOpportunityAction } from "@/actions/opportunity.actions";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const user = await requireAuthUser();
  const { id } = await params;
  const opp = await getOpportunityById(id, user);

  const canEdit = can(user.role, "update", "opportunities");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{opp.opportunityName}</h2>
              <Badge
                variant={
                  opp.stage === "WON"
                    ? "success"
                    : opp.stage === "LOST"
                    ? "destructive"
                    : "secondary"
                }
              >
                {opp.stage}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Customer:{" "}
              <Link href={`/customers/${opp.customerId}`} className="text-primary hover:underline font-medium">
                {opp.customer?.customerName}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline">
              <Link href={`/opportunities/${opp.id}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Deal
              </Link>
            </Button>
          )}

          {canEdit && opp.status === OpportunityStatus.OPEN && (
            <>
              <form
                action={async () => {
                  "use server";
                  const fd = new FormData();
                  fd.set("stage", OpportunityStage.WON);
                  fd.set("status", OpportunityStatus.WON);
                  fd.set("probability", "100");
                  await updateOpportunityAction(opp.id, fd);
                }}
              >
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark Won
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";
                  const fd = new FormData();
                  fd.set("stage", OpportunityStage.LOST);
                  fd.set("status", OpportunityStatus.LOST);
                  fd.set("probability", "0");
                  await updateOpportunityAction(opp.id, fd);
                }}
              >
                <Button type="submit" variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" /> Mark Lost
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-medium">Deal Amount</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {opp.amount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-medium">Win Probability</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold flex items-center">
              {opp.probability}
              <Percent className="h-4 w-4 ml-0.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-medium">Weighted Value</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {opp.weightedValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-medium">Target Close Date</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-lg font-bold flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
              {new Date(opp.expectedCloseDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Opportunity Overview</CardTitle>
            <CardDescription>Deal context and owner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Link href={`/customers/${opp.customerId}`} className="text-primary hover:underline font-medium">
                {opp.customer?.customerName}
              </Link>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium">{opp.assignedTo?.name || "Unassigned"}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={opp.status === "OPEN" ? "default" : opp.status === "WON" ? "success" : "destructive"}>
                {opp.status}
              </Badge>
            </div>

            {opp.notes && (
              <div className="pt-3 border-t">
                <p className="font-medium text-foreground mb-1">Notes</p>
                <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {opp.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Linked Follow-Ups</CardTitle>
                <CardDescription>Actions and appointments for this deal</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/follow-ups/new?opportunityId=${opp.id}`}>
                  <Plus className="h-3 w-3 mr-1" /> Add Follow-Up
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {opp.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No follow-ups recorded for this deal.
                </p>
              ) : (
                <div className="divide-y border rounded-lg">
                  {opp.followUps.map((f) => (
                    <div key={f.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{f.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.followUpType} on {new Date(f.followUpDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={f.status === "COMPLETED" ? "success" : "secondary"}>
                        {f.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
