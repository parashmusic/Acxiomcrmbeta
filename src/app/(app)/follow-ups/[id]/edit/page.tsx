"use client";

import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateFollowUpAction, deleteFollowUpAction } from "@/actions/followup.actions";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

interface EditFollowUpPageProps {
  params: Promise<{ id: string }>;
}

export default function EditFollowUpPage({ params }: EditFollowUpPageProps) {
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
      const res = await updateFollowUpAction(id, formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Follow-up updated successfully.");
      router.push("/follow-ups");
    });
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this follow-up?")) return;

    startTransition(async () => {
      const res = await deleteFollowUpAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete follow-up.");
        return;
      }
      toast.success("Follow-up deleted.");
      router.push("/follow-ups");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Update Follow-Up</h2>
            <p className="text-sm text-muted-foreground">Reschedule or change follow-up status.</p>
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
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Details</CardTitle>
          <CardDescription>Rescheduling and completions are audited.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required disabled={isPending} />
              {fieldErrors.subject && (
                <p className="text-xs text-destructive">{fieldErrors.subject[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followUpType">Type</Label>
                <Select name="followUpType">
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
                <Select name="status">
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate">Date</Label>
                <Input id="followUpDate" name="followUpDate" type="date" disabled={isPending} />
                {fieldErrors.followUpDate && (
                  <p className="text-xs text-destructive">{fieldErrors.followUpDate[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild disabled={isPending}>
              <Link href="/follow-ups">Cancel</Link>
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
