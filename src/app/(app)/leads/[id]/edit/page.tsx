"use client";

import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLeadAction, deleteLeadAction } from "@/actions/lead.actions";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default function EditLeadPage({ params }: EditLeadPageProps) {
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
      const res = await updateLeadAction(id, formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Lead updated successfully.");
      router.push(`/leads/${id}`);
    });
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    startTransition(async () => {
      const res = await deleteLeadAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete lead.");
        return;
      }
      toast.success("Lead deleted successfully.");
      router.push("/leads");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/leads/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Lead</h2>
            <p className="text-sm text-muted-foreground">Modify prospect information or assignment.</p>
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
          <Trash2 className="h-4 w-4" /> Delete Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
          <CardDescription>Update prospect details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadName">
                  Lead Name <span className="text-destructive">*</span>
                </Label>
                <Input id="leadName" name="leadName" required disabled={isPending} />
                {fieldErrors.leadName && (
                  <p className="text-xs text-destructive">{fieldErrors.leadName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" name="companyName" disabled={isPending} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" disabled={isPending} />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (10 digits)</Label>
                <Input id="phone" name="phone" disabled={isPending} />
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select name="source">
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="EMAIL_CAMPAIGN">Email Campaign</SelectItem>
                    <SelectItem value="COLD_CALL">Cold Call</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority">
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedValue">Expected Value (₹)</Label>
                <Input
                  id="expectedValue"
                  name="expectedValue"
                  type="number"
                  min="0"
                  max="100000000"
                  disabled={isPending}
                />
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
              <Link href={`/leads/${id}`}>Cancel</Link>
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
