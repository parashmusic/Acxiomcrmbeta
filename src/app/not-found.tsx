import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-primary font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Page Not Found</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        The resource you are trying to access does not exist or you do not have permission to view it.
      </p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
