"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createFollowUpAction } from "@/actions/followup.actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function NewFollowUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || "";
  const prefilledLeadId = searchParams.get("leadId") || "";
  const prefilledOppId = searchParams.get("opportunityId") || "";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [customers, setCustomers] = useState<Array<{ id: string; customerName: string }>>([]);
  const [leads, setLeads] = useState<Array<{ id: string; leadName: string }>>([]);

  useEffect(() => {
    fetch("/api/customers?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setCustomers(data.items);
      })
      .catch(() => {});

    fetch("/api/leads?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setLeads(data.items);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await createFollowUpAction(formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Follow-up scheduled successfully.");
      router.push("/follow-ups");
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/follow-ups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedule Follow-Up</h2>
          <p className="text-sm text-muted-foreground">Set up a call, meeting, email, or task.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Details</CardTitle>
          <CardDescription>Appointments must be scheduled for today or in the future.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject / Goal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Product demo call / Contract review"
                required
                disabled={isPending}
              />
              {fieldErrors.subject && (
                <p className="text-xs text-destructive">{fieldErrors.subject[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followUpType">Type</Label>
                <Select name="followUpType" defaultValue="CALL">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">Call</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="TASK">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate">
                  Follow-Up Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="followUpDate"
                  name="followUpDate"
                  type="date"
                  min={todayStr}
                  defaultValue={todayStr}
                  required
                  disabled={isPending}
                />
                {fieldErrors.followUpDate && (
                  <p className="text-xs text-destructive">{fieldErrors.followUpDate[0]}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-3 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Link Record (Choose at least one)</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Related Customer</Label>
                  <Select name="customerId" defaultValue={prefilledCustomerId || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadId">Related Lead</Label>
                  <Select name="leadId" defaultValue={prefilledLeadId || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.leadName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {prefilledOppId && (
                <input type="hidden" name="opportunityId" value={prefilledOppId} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks / Agenda</Label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Meeting links, discussion points, notes..."
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href="/follow-ups">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Scheduling..." : "Schedule Follow-Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NewFollowUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <NewFollowUpForm />
    </Suspense>
  );
}
