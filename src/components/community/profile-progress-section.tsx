"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/community/progress-ring";
import { Users } from "lucide-react";
import Link from "next/link";

interface ProfileProgressSectionProps {
  profilePct: number;
  membersCount: number;
  /**
   * Human-readable labels for missing birth-data fields (e.g.
   * "Date of birth", "Birth time", "Birth city"). The dashboard owns the
   * source of truth — this component just renders whatever it is handed.
   * Falls back to a generic message when the caller does not pass it.
   */
  missingFields?: string[];
}

export function ProfileProgressSection({
  profilePct,
  membersCount,
  missingFields,
}: ProfileProgressSectionProps) {
  const fieldsToList = missingFields ?? [];
  const isComplete = profilePct === 100 || fieldsToList.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Birth Data Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-around gap-4">
          {/* Birth-data readiness ring */}
          <ProgressRing
            percentage={profilePct}
            size={88}
            strokeWidth={8}
            label="Birth Data"
            sublabel={isComplete ? "Complete" : "Needed for charts"}
            color={isComplete ? "hsl(142, 71%, 45%)" : "hsl(var(--primary))"}
          />

          {/* Household members ring */}
          <ProgressRing
            percentage={membersCount > 0 ? Math.min(100, membersCount * 20) : 0}
            size={88}
            strokeWidth={8}
            label="Household Members"
            sublabel={`${membersCount} plan member${membersCount !== 1 ? "s" : ""}`}
            color="hsl(262, 80%, 60%)"
          />
        </div>

        {!isComplete && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Add the following for full chart accuracy:
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground pl-3">
              {fieldsToList.length > 0 ? (
                fieldsToList.map((field) => (
                  <li key={field}>• Add your {field.toLowerCase()}</li>
                ))
              ) : (
                <li>• Add your date of birth, birth time, and birth city</li>
              )}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/community/profile">
            <Users className="mr-1.5 size-3.5" />
            {isComplete ? "View Profile" : "Complete Profile"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
