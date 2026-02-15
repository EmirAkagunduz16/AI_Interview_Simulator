"use client";

import { useState, useEffect, useRef } from "react";
import { useVapi } from "@/features/interview/hooks/useVapi";
import { InterviewConfigForm } from "@/features/interview/components/InterviewConfigForm";
import { VoiceInterviewPanel } from "@/features/interview/components/VoiceInterviewPanel";
import { CompletedScreen } from "@/features/interview/components/CompletedScreen";
import { AuthGuard } from "@/features/auth/components";
import "./interview.scss";

export default function InterviewPage() {
  const [step, setStep] = useState<"config" | "interview" | "completed">(
    "config",
  );
  const [field, setField] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");

  const config = { field, techStack, difficulty };
  const vapi = useVapi(config);

  const shouldStartRef = useRef(false);

  useEffect(() => {
    if (vapi.overallScore !== null) {
      setStep("completed");
    }
  }, [vapi.overallScore]);

  useEffect(() => {
    if (step === "interview" && shouldStartRef.current) {
      shouldStartRef.current = false;
      const timer = setTimeout(() => vapi.startCall(), 300);
      return () => clearTimeout(timer);
    }
  }, [step, vapi.startCall]);

  const handleFieldChange = (newField: string) => {
    setField(newField);
    setTechStack([]);
  };

  const toggleTech = (tech: string) => {
    setTechStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech],
    );
  };

  const handleStartInterview = () => {
    if (!field) return;
    shouldStartRef.current = true;
    setStep("interview");
  };

  const handleRetry = () => {
    setStep("config");
    setField("");
    setTechStack([]);
  };

  const renderContent = () => {
    if (step === "config") {
      return (
        <InterviewConfigForm
          field={field}
          techStack={techStack}
          difficulty={difficulty}
          onFieldChange={handleFieldChange}
          onTechToggle={toggleTech}
          onDifficultyChange={setDifficulty}
          onStart={handleStartInterview}
        />
      );
    }

    if (step === "completed") {
      return (
        <CompletedScreen
          overallScore={vapi.overallScore}
          interviewId={vapi.interviewId}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <VoiceInterviewPanel
        field={field}
        techStack={techStack}
        isConnected={vapi.isConnected}
        isCallActive={vapi.isCallActive}
        isSpeaking={vapi.isSpeaking}
        volumeLevel={vapi.volumeLevel}
        currentQuestion={vapi.currentQuestion}
        error={vapi.error}
        onStartCall={vapi.startCall}
        onEndCall={vapi.endCall}
      />
    );
  };

  return (
    <AuthGuard>
      <div className="interview-page">{renderContent()}</div>
    </AuthGuard>
  );
}
