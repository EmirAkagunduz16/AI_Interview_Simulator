"use client";

import { useState, useEffect, useRef } from "react";
import { useElevenLabs } from "@/features/interview/hooks/useElevenLabs";
import { InterviewConfigForm } from "@/features/interview/components/InterviewConfigForm";
import { VoiceInterviewPanel } from "@/features/interview/components/VoiceInterviewPanel";
import { CompletedScreen } from "@/features/interview/components/CompletedScreen";
import { AuthGuard } from "@/features/auth/components";
import { interviewConfigSchema } from "@/lib/validation";
import "./interview.scss";

export default function InterviewPage() {
  const [step, setStep] = useState<"config" | "interview" | "completed">(
    "config",
  );
  const [field, setField] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");

  const config = { field, techStack, difficulty };
  const el = useElevenLabs(config);

  const shouldStartRef = useRef(false);

  useEffect(() => {
    if (el.overallScore !== null) {
      setStep("completed");
    }
  }, [el.overallScore]);

  /** Bitiş ekranına geçildiğinde ses oturumu hâlâ açıksa kapat (agentın konuşmaya devam etmesini engelle). */
  useEffect(() => {
    if (step === "completed") {
      void el.endCall();
    }
  }, [step, el.endCall]);

  useEffect(() => {
    if (step === "interview" && shouldStartRef.current) {
      shouldStartRef.current = false;
      const timer = setTimeout(() => el.startCall(), 300);
      return () => clearTimeout(timer);
    }
  }, [step, el.startCall, el]);

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
    const result = interviewConfigSchema.safeParse({
      field,
      techStack,
      difficulty,
    });
    if (!result.success) return;
    shouldStartRef.current = true;
    setStep("interview");
  };

  const handleRetry = () => {
    setStep("config");
    setField("");
    setTechStack([]);
  };

  const handleBack = () => {
    if (el.isCallActive) {
      el.endCall();
    }
    setStep("config");
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
          overallScore={el.overallScore}
          interviewId={el.interviewId}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <VoiceInterviewPanel
        field={field}
        techStack={techStack}
        difficulty={difficulty}
        isConnected={el.isConnected}
        isCallActive={el.isCallActive}
        isSpeaking={el.isSpeaking}
        micMuted={el.micMuted}
        agentStatus={el.agentStatus}
        inputVolume={el.inputVolume}
        outputVolume={el.outputVolume}
        currentQuestion={el.currentQuestion}
        error={el.error}
        transcript={el.transcript}
        onStartCall={el.startCall}
        onEndCall={el.endCall}
        onSendMessage={el.sendTextMessage}
        onToggleMic={el.toggleMic}
        onBack={handleBack}
      />
    );
  };

  return (
    <AuthGuard>
      {step === "config" ? (
        <div className="interview-config-page">
          {renderContent()}
        </div>
      ) : (
        <div className={`interview-page ${step === "interview" ? "el-active" : ""}`}>
          {renderContent()}
        </div>
      )}
    </AuthGuard>
  );
}
