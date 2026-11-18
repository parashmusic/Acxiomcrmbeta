"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createOpportunityAction } from "@/actions/opportunity.actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function NewOpportunityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [customers, setCustomers] = useState<Array<{ id: string; customerName: string }>>([]);

  useEffect(() => {
    fetch("/api/customers?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setCustomers(data.items);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await createOpportunityAction(formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Opportunity created successfully.");
      router.push(`/opportunities/${res.data?.id}`);
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 30);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/opportunities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Opportunity</h2>
          <p className="text-sm text-muted-foreground">Create a new deal in the sales pipeline.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Overview</CardTitle>
          <CardDescription>Enter opportunity parameters and projected closing date.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="opportunityName">
                Opportunity Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="opportunityName"
                name="opportunityName"
                placeholder="Enterprise CRM Expansion"
                required
                disabled={isPending}
              />
              {fieldErrors.opportunityName && (
                <p className="text-xs text-destructive">{fieldErrors.opportunityName[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerId">
                Customer Account <span className="text-destructive">*</span>
              </Label>
              {customers.length > 0 ? (
                <Select name="customerId" defaultValue={prefilledCustomerId || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="customerId"
                  name="customerId"
                  placeholder="Enter Customer ID"
                  defaultValue={prefilledCustomerId}
                  required
                  disabled={isPending}
                />
              )}
              {fieldErrors.customerId && (
                <p className="text-xs text-destructive">{fieldErrors.customerId[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Deal Amount (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000000"
                  required
                  disabled={isPending}
                />
                {fieldErrors.amount && (
                  <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">Probability (0 - 100%)</Label>
                <Input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="25"
                  required
                  disabled={isPending}
                />
                {fieldErrors.probability && (
                  <p className="text-xs text-destructive">{fieldErrors.probability[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Initial Stage</Label>
                <Select name="stage" defaultValue="QUALIFICATION">
                  <SelectTrigger>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                    <SelectItem value="PROPOSAL">Proposal</SelectItem>
                    <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">
                  Expected Close Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expectedCloseDate"
                  name="expectedCloseDate"
                  type="date"
                  defaultValue={defaultDate}
                  required
                  disabled={isPending}
                />
                {fieldErrors.expectedCloseDate && (
                  <p className="text-xs text-destructive">{fieldErrors.expectedCloseDate[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Deal criteria, scope, and key deliverables..."
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href="/opportunities">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Opportunity"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <NewOpportunityForm />
    </Suspense>
  );
}
