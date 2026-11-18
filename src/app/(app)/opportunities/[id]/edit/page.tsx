"use client";

import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOpportunityAction, deleteOpportunityAction } from "@/actions/opportunity.actions";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

interface EditOpportunityPageProps {
  params: Promise<{ id: string }>;
}

export default function EditOpportunityPage({ params }: EditOpportunityPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await updateOpportunityAction(id, formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Opportunity updated successfully.");
      router.push(`/opportunities/${id}`);
    });
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    startTransition(async () => {
      const res = await deleteOpportunityAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete opportunity.");
        return;
      }
      toast.success("Opportunity deleted successfully.");
      router.push("/opportunities");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/opportunities/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Opportunity</h2>
            <p className="text-sm text-muted-foreground">Update pipeline stage, valuation, and close date.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" /> Delete Deal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Parameters</CardTitle>
          <CardDescription>Changes will update the aggregate pipeline report.</CardDescription>
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
              <Input id="opportunityName" name="opportunityName" required disabled={isPending} />
              {fieldErrors.opportunityName && (
                <p className="text-xs text-destructive">{fieldErrors.opportunityName[0]}</p>
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
                <Label htmlFor="stage">Stage</Label>
                <Select name="stage">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Stage" />
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
                <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                <Input id="expectedCloseDate" name="expectedCloseDate" type="date" disabled={isPending} />
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
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href={`/opportunities/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
