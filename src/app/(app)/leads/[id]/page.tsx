import { requireAuthUser } from "@/lib/auth/session";
import { getLeadById } from "@/services/lead.service";
import { can } from "@/lib/rbac";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
  CheckCircle2,
} from "lucide-react";
import { LeadStatus } from "@prisma/client";
import { leadStatusTransitions } from "@/schemas/lead.schema";
import { updateLeadAction, convertLeadAction } from "@/actions/lead.actions";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const user = await requireAuthUser();
  const { id } = await params;
  const lead = await getLeadById(id, user);

  const canEdit = can(user.role, "update", "leads");
  const canConvert = can(user.role, "convert", "leads") && lead.status === LeadStatus.QUALIFIED;
  const nextAllowedTransitions = leadStatusTransitions[lead.status] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{lead.leadName}</h2>
              <Badge variant="default">{lead.status}</Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{lead.leadCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline">
              <Link href={`/leads/${lead.id}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Lead
              </Link>
            </Button>
          )}

          {canConvert && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await convertLeadAction(lead.id, formData);
              }}
            >
              <input type="hidden" name="createOpportunity" value="true" />
              <input type="hidden" name="opportunityName" value={`${lead.leadName} - Initial Deal`} />
              <input type="hidden" name="amount" value={lead.expectedValue || "100000"} />
              <input
                type="hidden"
                name="expectedCloseDate"
                value={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Convert to Customer
              </Button>
            </form>
          )}
        </div>
      </div>

      {nextAllowedTransitions.length > 0 && (
        <Card className="border-primary/20 bg-muted/30">
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium">Valid Next Status Transitions:</span>
            <div className="flex items-center gap-2">
              {nextAllowedTransitions.map((nextStatus) => (
                <form
                  key={nextStatus}
                  action={async () => {
                    "use server";
                    const formData = new FormData();
                    formData.set("status", nextStatus);
                    await updateLeadAction(lead.id, formData);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    Mark as {nextStatus}
                  </Button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
            <CardDescription>Prospect contact profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {lead.email && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-foreground shrink-0" />
                <span className="text-foreground">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-foreground shrink-0" />
                <span className="text-foreground">{lead.phone}</span>
              </div>
            )}
            {lead.companyName && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building className="h-4 w-4 text-foreground shrink-0" />
                <span className="text-foreground">{lead.companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="h-4 w-4 text-foreground shrink-0" />
              <span>Assigned: </span>
              <span className="font-medium text-foreground">{lead.assignedTo?.name || "Unassigned"}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4 text-foreground shrink-0" />
              <span>Created: </span>
              <span className="text-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline">{lead.priority}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium">{lead.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Value:</span>
                <span className="font-semibold text-emerald-600">
                  {lead.expectedValue ? `₹${lead.expectedValue.toLocaleString()}` : "-"}
                </span>
              </div>
            </div>

            {lead.convertedCustomer && (
              <div className="pt-3 border-t bg-muted/40 p-3 rounded-md">
                <p className="text-xs font-semibold text-primary">Converted Customer</p>
                <Link
                  href={`/customers/${lead.convertedCustomer.id}`}
                  className="text-sm font-medium hover:underline text-primary"
                >
                  {lead.convertedCustomer.customerName}
                </Link>
                <p className="text-xs font-mono text-muted-foreground">
                  {lead.convertedCustomer.customerCode}
                </p>
              </div>
            )}

            {lead.notes && (
              <div className="pt-3 border-t">
                <p className="font-medium text-foreground mb-1">Notes</p>
                <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {lead.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Follow-Up History</CardTitle>
                <CardDescription>Scheduled contact appointments</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/follow-ups/new?leadId=${lead.id}`}>Schedule</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {lead.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No follow-ups recorded for this lead.
                </p>
              ) : (
                <div className="divide-y border rounded-lg">
                  {lead.followUps.map((f) => (
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
