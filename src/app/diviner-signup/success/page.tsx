import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Account Created — Professional Divination Course",
};

export default async function DivinerSignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Account created
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve registered your account
            {email ? (
              <>
                {" "}
                for <strong className="text-foreground">{email}</strong>
              </>
            ) : null}
            . Payment integration is coming next — you&apos;ll receive an
            email when the secure payment step is ready.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Continue to login</Link>
        </Button>
      </div>
    </div>
  );
}
