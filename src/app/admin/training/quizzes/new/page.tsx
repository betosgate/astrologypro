"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrainingQuizForm,
  type TrainingQuizFormValue,
  type TrainingQuizLessonOption,
} from "@/components/admin/training-quiz-form";

export default function NewQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<TrainingQuizLessonOption[]>([]);
  const [remediationSupported, setRemediationSupported] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      try {
        const res = await fetch("/api/admin/training/lessons?pageSize=100");
        if (!res.ok) {
          toast.error("Failed to load lessons.");
          return;
        }
        const data = await res.json();
        setLessons(data.lessons ?? []);
      } catch {
        toast.error("Failed to load lessons.");
      }
    }

    void loadLessons();
  }, []);

  async function handleSubmit(value: TrainingQuizFormValue) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/training/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create quiz.");
        return;
      }

      setRemediationSupported(data.remediation_supported !== false);
      toast.success("Quiz created.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TrainingQuizForm
      key={`new-quiz:${lessons[0]?.id ?? "none"}`}
      heading="New Quiz"
      description="Create a lesson quiz and manage its questions directly, including optional wrong-answer remediation."
      submitLabel="Create Quiz"
      cancelHref="/admin/training"
      lessons={lessons}
      remediationSupported={remediationSupported}
      initialValue={{
        title: "",
        lesson_id: lessons[0]?.id ?? "",
        is_active: true,
        questions: [],
      }}
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
}
