import { requireAuthUser } from "@/lib/auth/session";
import { getCustomerById } from "@/services/customer.service";
import { can } from "@/lib/rbac";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  User,
  Plus,
} from "lucide-react";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const user = await requireAuthUser();
  const { id } = await params;
  const customer = await getCustomerById(id, user);

  const canEdit = can(user.role, "update", "customers");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{customer.customerName}</h2>
              <Badge variant={customer.status === "ACTIVE" ? "success" : "secondary"}>
                {customer.status}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{customer.customerCode}</p>
          </div>
        </div>

        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/customers/${customer.id}/edit`} className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit Customer
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Primary profile and assignment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4 text-foreground shrink-0" />
              <span className="text-foreground">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-4 w-4 text-foreground shrink-0" />
              <span className="text-foreground">{customer.phone}</span>
            </div>
            {customer.companyName && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building className="h-4 w-4 text-foreground shrink-0" />
                <span className="text-foreground">{customer.companyName}</span>
              </div>
            )}
            {(customer.address || customer.city || customer.state) && (
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                <span className="text-foreground">
                  {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="h-4 w-4 text-foreground shrink-0" />
              <span>Assigned: </span>
              <span className="font-medium text-foreground">
                {customer.assignedTo?.name || "Unassigned"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-4 w-4 text-foreground shrink-0" />
              <span>Created: </span>
              <span className="text-foreground">
                {new Date(customer.createdAt).toLocaleDateString()}
              </span>
            </div>

            {customer.notes && (
              <div className="pt-4 border-t">
                <p className="font-medium text-foreground mb-1">Notes</p>
                <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="opportunities">Deals ({customer.opportunities.length})</TabsTrigger>
              <TabsTrigger value="followups">Follow-Ups ({customer.followUps.length})</TabsTrigger>
              <TabsTrigger value="activities">Activities ({customer.activities.length})</TabsTrigger>
              <TabsTrigger value="leads">Leads ({customer.leads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="opportunities" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Opportunities</h4>
                <Button size="sm" asChild>
                  <Link href={`/opportunities/new?customerId=${customer.id}`}>
                    <Plus className="h-3 w-3 mr-1" /> New Opportunity
                  </Link>
                </Button>
              </div>
              {customer.opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                  No opportunities associated with this customer.
                </p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {customer.opportunities.map((opp) => (
                    <div key={opp.id} className="p-4 flex items-center justify-between">
                      <div>
                        <Link href={`/opportunities/${opp.id}`} className="font-medium text-primary hover:underline">
                          {opp.opportunityName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Close Date: {new Date(opp.expectedCloseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{Number(opp.amount).toLocaleString()}</p>
                        <Badge variant="outline" className="text-[10px]">{opp.stage}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="followups" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Scheduled Follow-Ups</h4>
                <Button size="sm" asChild>
                  <Link href={`/follow-ups/new?customerId=${customer.id}`}>
                    <Plus className="h-3 w-3 mr-1" /> Schedule Follow-Up
                  </Link>
                </Button>
              </div>
              {customer.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                  No follow-ups recorded.
                </p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {customer.followUps.map((f) => (
                    <div key={f.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{f.subject}</p>
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
            </TabsContent>

            <TabsContent value="activities" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Activity Log</h4>
                <Button size="sm" asChild>
                  <Link href={`/activities/new?customerId=${customer.id}`}>
                    <Plus className="h-3 w-3 mr-1" /> Log Activity
                  </Link>
                </Button>
              </div>
              {customer.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                  No activities recorded.
                </p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {customer.activities.map((a) => (
                    <div key={a.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{a.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.activityType} on {new Date(a.activityDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="leads" className="mt-4 space-y-4">
              <h4 className="font-semibold text-sm">Converted Leads</h4>
              {customer.leads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">
                  No converted leads.
                </p>
              ) : (
                <div className="border rounded-lg divide-y">
                  {customer.leads.map((l) => (
                    <div key={l.id} className="p-4 flex items-center justify-between">
                      <div>
                        <Link href={`/leads/${l.id}`} className="font-medium text-primary hover:underline">
                          {l.leadName}
                        </Link>
                        <p className="text-xs font-mono text-muted-foreground">{l.leadCode}</p>
                      </div>
                      <Badge variant="success">CONVERTED</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
