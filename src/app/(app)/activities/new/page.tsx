"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createActivityAction } from "@/actions/activity.actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function NewActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledCustomerId = searchParams.get("customerId") || "";
  const prefilledLeadId = searchParams.get("leadId") || "";

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
      const res = await createActivityAction(formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Activity logged successfully.");
      router.push("/activities");
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/activities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Log Activity</h2>
          <p className="text-sm text-muted-foreground">Record a call, meeting, email, or internal task.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Document touchpoints with customers and leads.</CardDescription>
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
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Product architecture discussion / Q3 check-in"
                required
                disabled={isPending}
              />
              {fieldErrors.subject && (
                <p className="text-xs text-destructive">{fieldErrors.subject[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activityType">Activity Type</Label>
                <Select name="activityType" defaultValue="CALL">
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
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
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="COMPLETED">
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityDate">Date</Label>
                <Input
                  id="activityDate"
                  name="activityDate"
                  type="date"
                  defaultValue={todayStr}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Key meeting takeaways, next steps..."
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href="/activities">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Logging..." : "Log Activity"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <NewActivityForm />
    </Suspense>
  );
}
