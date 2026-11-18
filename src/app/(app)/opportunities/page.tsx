import { requireAuthUser } from "@/lib/auth/session";
import { listOpportunities, getPipelineByStage } from "@/services/opportunity.service";
import { opportunityQuerySchema } from "@/schemas/opportunity.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data-table/pagination";
import Link from "next/link";
import { Plus, Search, Eye, Edit } from "lucide-react";
import { can } from "@/lib/rbac";
import { OpportunityStage } from "@prisma/client";

interface OpportunitiesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    stage?: string;
    status?: string;
    customerId?: string;
    assignedToId?: string;
  }>;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const query = opportunityQuerySchema.parse({
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    search: params.search || undefined,
    stage: params.stage || undefined,
    status: params.status || undefined,
    customerId: params.customerId || undefined,
    assignedToId: params.assignedToId || undefined,
  });

  const [listResult, pipelineByStage] = await Promise.all([
    listOpportunities(query, user),
    getPipelineByStage(user),
  ]);

  const { items, total, page, pageSize, totalPages } = listResult;
  const canCreate = can(user.role, "create", "opportunities");
  const canUpdate = can(user.role, "update", "opportunities");

  const stageOrder: OpportunityStage[] = [
    OpportunityStage.QUALIFICATION,
    OpportunityStage.PROPOSAL,
    OpportunityStage.NEGOTIATION,
    OpportunityStage.WON,
    OpportunityStage.LOST,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">Manage deal pipeline, stages, and weighted revenue.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/opportunities/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Opportunity
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="table" className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Kanban</TabsTrigger>
          </TabsList>

          <form className="flex-1 max-w-sm flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search deals or customers..."
                defaultValue={query.search || ""}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
        </div>

        <TabsContent value="table" className="mt-4 space-y-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Weighted Value</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No opportunities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((opp) => (
                    <TableRow key={opp.id}>
                      <TableCell className="font-medium">
                        <Link href={`/opportunities/${opp.id}`} className="hover:underline text-primary">
                          {opp.opportunityName}
                        </Link>
                      </TableCell>
                      <TableCell>{opp.customer?.customerName || "-"}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="font-semibold">₹{opp.amount.toLocaleString()}</TableCell>
                      <TableCell>{opp.probability}%</TableCell>
                      <TableCell className="text-muted-foreground">
                        ₹{opp.weightedValue.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(opp.expectedCloseDate).toLocaleDateString()}</TableCell>
                      <TableCell>{opp.assignedTo?.name || "Unassigned"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" asChild title="View Details">
                          <Link href={`/opportunities/${opp.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canUpdate && (
                          <Button variant="ghost" size="icon" asChild title="Edit Deal">
                            <Link href={`/opportunities/${opp.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {stageOrder.map((stage) => {
              const opps = pipelineByStage[stage] || [];
              const stageTotal = opps.reduce((acc, curr) => acc + curr.amount, 0);

              return (
                <div key={stage} className="bg-muted/40 rounded-lg p-3 border flex flex-col min-w-[220px]">
                  <div className="flex items-center justify-between pb-2 border-b mb-3">
                    <span className="font-semibold text-xs uppercase tracking-wider">{stage}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {opps.length}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3 font-medium">
                    Total: ₹{stageTotal.toLocaleString()}
                  </div>

                  <div className="space-y-2 flex-1">
                    {opps.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No deals</p>
                    ) : (
                      opps.map((opp) => (
                        <div
                          key={opp.id}
                          className="bg-card p-3 rounded-md border shadow-sm space-y-1 hover:border-primary transition-colors"
                        >
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="font-medium text-xs text-primary hover:underline line-clamp-1"
                          >
                            {opp.opportunityName}
                          </Link>
                          <p className="text-[11px] text-muted-foreground">{opp.customer?.customerName}</p>
                          <div className="flex justify-between items-center pt-1 text-xs">
                            <span className="font-bold">₹{opp.amount.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {opp.probability}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
