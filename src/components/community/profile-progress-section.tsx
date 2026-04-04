"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/community/progress-ring";
import { Users } from "lucide-react";
import Link from "next/link";

interface ProfileProgressSectionProps {
  profilePct: number;
  membersCount: number;
}

export function ProfileProgressSection({
  profilePct,
  membersCount,
}: ProfileProgressSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Profile Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-around gap-4">
          {/* My Profile ring */}
          <ProgressRing
            percentage={profilePct}
            size={88}
            strokeWidth={8}
            label="Your Profile"
            sublabel="Birth data filled"
            color={profilePct === 100 ? "hsl(142, 71%, 45%)" : "hsl(var(--primary))"}
          />

          {/* Members ring — approximate metric based on other active members */}
          <ProgressRing
            percentage={membersCount > 0 ? Math.min(100, membersCount * 20) : 0}
            size={88}
            strokeWidth={8}
            label="Members Connected"
            sublabel={`${membersCount} active member${membersCount !== 1 ? "s" : ""}`}
            color="hsl(262, 80%, 60%)"
          />
        </div>

        {profilePct < 100 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Complete your profile for full chart accuracy:
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground pl-3">
              {profilePct < 34 && <li>• Add your date of birth</li>}
              {profilePct < 67 && profilePct >= 34 && <li>• Add your birth time</li>}
              {profilePct < 100 && profilePct >= 67 && <li>• Add your birth city</li>}
              {profilePct === 0 && <li>• Add your date of birth, birth time, and birth city</li>}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/community/profile">
            <Users className="mr-1.5 size-3.5" />
            {profilePct === 100 ? "View Profile" : "Complete Profile"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
