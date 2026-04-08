import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCcw } from "lucide-react";

export const metadata = { title: "Mystery School Checkout Cancelled - AstrologyPro" };

export default function MysterySchoolCheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Mystery School Checkout
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Checkout Was Not Completed</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          No problem. Your enrollment has not been finalized, and you can return whenever you are ready to continue.
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Your Place Is Still Open</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Review the program details again, choose your quarter, and restart checkout when the timing is right.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/mystery-school/enroll">
                <RefreshCcw className="size-4" /> Return to Enrollment
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/community">
                <ArrowLeft className="size-4" /> Back to Community
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
