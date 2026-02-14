"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "./useAppDispatch";

type InterviewStep =
  | "select-field"
  | "welcome"
  | "details"
  | "audio"
  | "video"
  | "mcq"
  | "coding"
  | "result";

/**
 * Interview akisini koruyan hook.
 * Kullanici dogru adimda degilse onceki adima yonlendirir.
 */
export function useInterviewGuard(currentStep: InterviewStep): boolean {
  const router = useRouter();
  const { selectedField, isInterviewStarted, isInterviewCompleted } =
    useAppSelector((state) => state.interview);

  useEffect(() => {
    let redirectTo: string | null = null;

    switch (currentStep) {
      case "welcome":
        if (!selectedField) redirectTo = "/select-field";
        break;
      case "details":
        if (!selectedField) redirectTo = "/select-field";
        break;
      case "audio":
      case "video":
      case "mcq":
      case "coding":
        if (!isInterviewStarted) redirectTo = "/select-field";
        break;
      case "result":
        if (!isInterviewCompleted) redirectTo = "/select-field";
        break;
    }

    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [
    currentStep,
    selectedField,
    isInterviewStarted,
    isInterviewCompleted,
    router,
  ]);

  // Erisim izni var mi?
  switch (currentStep) {
    case "select-field":
      return true;
    case "welcome":
    case "details":
      return !!selectedField;
    case "audio":
    case "video":
    case "mcq":
    case "coding":
      return isInterviewStarted;
    case "result":
      return isInterviewCompleted;
    default:
      return true;
  }
}
