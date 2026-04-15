"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrainingQuizForm,
  type TrainingQuizFormValue,
  type TrainingQuizLessonOption,
} from "@/components/admin/training-quiz-form";
import { SectionContainer } from "@/components/shared/section-container";

type ApiQuestion = {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string | null;
  priority?: number | null;
  remediation_video_index?: number | null;
  remediation_start_seconds?: number | null;
  remediation_replay_until_seconds?: number | null;
};

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [lessons, setLessons] = useState<TrainingQuizLessonOption[]>([]);
  const [initialValue, setInitialValue] = useState<TrainingQuizFormValue | null>(null);
  const [remediationSupported, setRemediationSupported] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [quizRes, lessonsRes] = await Promise.all([
          fetch(`/api/admin/training/quizzes/${id}`),
          fetch("/api/admin/training/lessons?pageSize=100"),
        ]);

        if (!quizRes.ok) {
          toast.error("Quiz not found.");
          router.push("/admin/training");
          return;
        }

        const quizData = await quizRes.json();
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : { lessons: [] };
        const q = quizData.quiz;

        setLessons(lessonsData.lessons ?? []);
        setInitialValue({
          title: q.title ?? "",
          lesson_id: q.lesson_id ?? "",
          is_active: q.is_active ?? true,
          questions: Array.isArray(q.questions)
            ? (q.questions as ApiQuestion[]).map((question, index) => ({
                question: question.question ?? "",
                options: Array.isArray(question.options) ? question.options : [],
                correct_answer: question.correct_answer ?? 0,
                explanation: question.explanation ?? null,
                priority: question.priority ?? index,
                remediation_video_index: question.remediation_video_index ?? null,
                remediation_start_seconds: question.remediation_start_seconds ?? null,
                remediation_replay_until_seconds:
                  question.remediation_replay_until_seconds ?? null,
              }))
            : [],
        });
        setRemediationSupported(quizData.remediation_supported !== false);
      } catch {
        toast.error("Failed to load quiz.");
        router.push("/admin/training");
      } finally {
        setFetching(false);
      }
    }

    void load();
  }, [id, router]);

  async function handleSubmit(value: TrainingQuizFormValue) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update quiz.");
        return;
      }

      setRemediationSupported(data.remediation_supported !== false);
      toast.success("Quiz updated.");
      router.push("/admin/training");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching || !initialValue) {
    return (
      <SectionContainer verticalPadding="none" className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Edit Quiz</h1>
        </div>
        <div className="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground">
          Loading quiz…
        </div>
      </SectionContainer>
    );
  }

  return (
    <TrainingQuizForm
      key={`${id}:${initialValue.lesson_id}:${initialValue.questions.length}`}
      heading="Edit Quiz"
      description="Update quiz settings and manage question-level remediation from the quiz editor."
      submitLabel="Save Changes"
      cancelHref="/admin/training"
      lessons={lessons}
      remediationSupported={remediationSupported}
      initialValue={initialValue}
      loading={loading}
      onSubmit={handleSubmit}
    />
  );
}
