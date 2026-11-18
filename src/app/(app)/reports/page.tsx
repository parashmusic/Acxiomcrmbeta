import { requireAuthUser } from "@/lib/auth/session";
import {
  getCustomerReport,
  getLeadReport,
  getOpportunityReport,
  getFollowUpReport,
  getPipelineReport,
  getConversionReport,
} from "@/services/report.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileBarChart } from "lucide-react";

export default async function ReportsPage() {
  const user = await requireAuthUser();

  const [customerData, leadData, oppData, followUpData, pipelineData, conversionData] =
    await Promise.all([
      getCustomerReport(user),
      getLeadReport(user),
      getOpportunityReport(user),
      getFollowUpReport(user),
      getPipelineReport(user),
      getConversionReport(user),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          </div>
          <p className="text-muted-foreground">
            Audited reports with role-based scoping and export capabilities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Lead Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">{conversionData.leads.conversionRate}</div>
            <p className="text-xs text-muted-foreground">
              {conversionData.leads.converted} of {conversionData.leads.total} leads converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Opportunity Win Rate</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600">{conversionData.opportunities.winRate}</div>
            <p className="text-xs text-muted-foreground">
              {conversionData.opportunities.won} won vs {conversionData.opportunities.lost} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Open Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">
              ₹
              {pipelineData.byStage
                .reduce((acc, curr) => acc + curr.totalAmount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all stages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Weighted Revenue</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600">
              ₹
              {pipelineData.byStage
                .reduce((acc, curr) => acc + curr.weightedAmount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Probability-adjusted projection</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full">
          <TabsTrigger value="customers">Customers ({customerData.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leadData.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({oppData.length})</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline by Owner</TabsTrigger>
          <TabsTrigger value="followups">Follow-Ups ({followUpData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Directory Report</CardTitle>
                <CardDescription>Exportable table of all visible client accounts</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerData.slice(0, 15).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{c.CustomerCode}</TableCell>
                        <TableCell className="font-medium">{c.CustomerName}</TableCell>
                        <TableCell>{c.Email}</TableCell>
                        <TableCell>{c.Phone}</TableCell>
                        <TableCell>{c.Status}</TableCell>
                        <TableCell>{c.AssignedTo}</TableCell>
                        <TableCell>{c.CreatedDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Lead Acquisition & Status Report</CardTitle>
                <CardDescription>Source channels and qualification progression</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Expected Value</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadData.slice(0, 15).map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{l.LeadCode}</TableCell>
                        <TableCell className="font-medium">{l.LeadName}</TableCell>
                        <TableCell>{l.Source}</TableCell>
                        <TableCell>{l.Status}</TableCell>
                        <TableCell>{l.Priority}</TableCell>
                        <TableCell>₹{l.ExpectedValue.toLocaleString()}</TableCell>
                        <TableCell>{l.AssignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opportunities Summary Report</CardTitle>
              <CardDescription>Valuation, win rates, and target dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Weighted</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oppData.slice(0, 15).map((o, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{o.OpportunityName}</TableCell>
                        <TableCell>{o.Customer}</TableCell>
                        <TableCell className="font-semibold">₹{o.Amount.toLocaleString()}</TableCell>
                        <TableCell>{o.Stage}</TableCell>
                        <TableCell>{o.Probability}</TableCell>
                        <TableCell className="text-muted-foreground">₹{o.WeightedValue.toLocaleString()}</TableCell>
                        <TableCell>{o.ExpectedCloseDate}</TableCell>
                        <TableCell>{o.AssignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Breakdown by Sales Rep</CardTitle>
              <CardDescription>Deals and weighted pipeline attributed to sales owners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Active Deals</TableHead>
                      <TableHead>Total Deal Value</TableHead>
                      <TableHead>Weighted Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineData.byOwner.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.owner}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell className="font-semibold">₹{item.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">₹{item.weightedAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Ups Operational Summary</CardTitle>
              <CardDescription>Scheduled and completed touchpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Related To</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUpData.slice(0, 15).map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{f.FollowUpDate}</TableCell>
                        <TableCell className="font-medium">{f.Subject}</TableCell>
                        <TableCell>{f.Type}</TableCell>
                        <TableCell>{f.Status}</TableCell>
                        <TableCell>{f.RelatedTo}</TableCell>
                        <TableCell>{f.AssignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
