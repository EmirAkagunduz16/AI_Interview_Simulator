"use client";

import { useState, useEffect } from "react";
import { useVapi } from "@/features/interview/hooks/useVapi";
import { InterviewConfigForm } from "@/features/interview/components/InterviewConfigForm";
import { VoiceInterviewPanel } from "@/features/interview/components/VoiceInterviewPanel";
import { CompletedScreen } from "@/features/interview/components/CompletedScreen";
import "./interview.scss";

export default function InterviewPage() {
  const [step, setStep] = useState<"config" | "interview" | "completed">(
    "config",
  );
  const [field, setField] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");

  const config = step !== "config" ? { field, techStack, difficulty } : null;
  const vapi = useVapi(config);

  useEffect(() => {
    if (vapi.overallScore !== null) {
      setStep("completed");
    }
  }, [vapi.overallScore]);

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
    setStep("interview");
    setTimeout(() => vapi.startCall(), 500);
  };

  const handleRetry = () => {
    setStep("config");
    setField("");
    setTechStack([]);
  };

  if (step === "config") {
    return (
      <div className="interview-page">
        <InterviewConfigForm
          field={field}
          techStack={techStack}
          difficulty={difficulty}
          onFieldChange={handleFieldChange}
          onTechToggle={toggleTech}
          onDifficultyChange={setDifficulty}
          onStart={handleStartInterview}
        />
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="interview-page">
        <CompletedScreen
          overallScore={vapi.overallScore}
          interviewId={vapi.interviewId}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="interview-page">
      <VoiceInterviewPanel
        field={field}
        techStack={techStack}
        isConnected={vapi.isConnected}
        isCallActive={vapi.isCallActive}
        isSpeaking={vapi.isSpeaking}
        volumeLevel={vapi.volumeLevel}
        currentQuestion={vapi.currentQuestion}
        transcript={vapi.transcript}
        error={vapi.error}
        onStartCall={vapi.startCall}
        onEndCall={vapi.endCall}
      />
    </div>
  );
}
