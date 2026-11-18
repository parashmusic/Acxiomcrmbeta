"use client";

import { useState, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCustomerAction, deactivateCustomerAction } from "@/actions/customer.actions";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
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
      const res = await updateCustomerAction(id, formData);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
        }
        return;
      }

      toast.success("Customer updated successfully.");
      router.push(`/customers/${id}`);
    });
  }

  async function handleDeactivate() {
    if (!confirm("Are you sure you want to deactivate this customer?")) return;

    startTransition(async () => {
      const res = await deactivateCustomerAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to deactivate customer.");
        return;
      }
      toast.success("Customer marked as inactive.");
      router.push("/customers");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/customers/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Customer</h2>
            <p className="text-sm text-muted-foreground">Update contact information or customer status.</p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDeactivate}
          disabled={isPending}
          className="flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" /> Deactivate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Changes will be recorded in the audit trail.</CardDescription>
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
                <Label htmlFor="customerName">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input id="customerName" name="customerName" required disabled={isPending} />
                {fieldErrors.customerName && (
                  <p className="text-xs text-destructive">{fieldErrors.customerName[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" name="companyName" disabled={isPending} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input id="email" name="email" type="email" required disabled={isPending} />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone (10 digits) <span className="text-destructive">*</span>
                </Label>
                <Input id="phone" name="phone" required disabled={isPending} />
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="ACTIVE">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" name="address" disabled={isPending} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" disabled={isPending} />
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
              <Link href={`/customers/${id}`}>Cancel</Link>
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
