/**
 * Handles VAPI function-call messages by forwarding to the backend webhook
 * and sending results back to the VAPI instance.
 *
 * Accumulates answers client-side as a safety net for evaluation.
 */

import type Vapi from "@vapi-ai/web";
import api from "@/lib/axios";

export interface VapiStateSetters {
  setInterviewId: (id: string) => void;
  setCurrentQuestion: (q: string) => void;
  setOverallScore: (score: number) => void;
}

export interface AccumulatedAnswer {
  question: string;
  answer: string;
  order: number;
  questionId?: string;
}

let accumulatedAnswers: AccumulatedAnswer[] = [];

export function getAccumulatedAnswers(): AccumulatedAnswer[] {
  return [...accumulatedAnswers];
}

export function resetAccumulatedAnswers(): void {
  accumulatedAnswers = [];
}

export async function handleVapiFunctionCall(
  msg: any,
  vapiInstance: Vapi,
  setters: VapiStateSetters,
): Promise<void> {
  const { functionCall } = msg;
  if (!functionCall) return;

  try {
    const response = await api.post("/ai/vapi/webhook", { message: msg });
    const data = response.data;
    const result = data.result || {};

    switch (functionCall.name) {
      case "save_preferences": {
        resetAccumulatedAnswers();
        if (result.interviewId) {
          setters.setInterviewId(result.interviewId);
        }
        if (result.firstQuestion) {
          setters.setCurrentQuestion(result.firstQuestion);
        }
        break;
      }

      case "save_answer": {
        const params = functionCall.parameters || {};
        accumulatedAnswers.push({
          question: params.questionText || `Soru ${params.questionOrder}`,
          answer: params.answer || "",
          order: params.questionOrder || accumulatedAnswers.length + 1,
          questionId: params.questionId,
        });

        if (result.nextQuestion) {
          setters.setCurrentQuestion(result.nextQuestion);
        }
        if (result.finished) {
          setters.setCurrentQuestion("");
        }
        break;
      }

      case "end_interview": {
        const score =
          result.overallScore ?? result.score ?? result.overall_score;
        setters.setOverallScore(score != null ? score : 0);
        break;
      }
    }

    vapiInstance.send({
      type: "add-message",
      message: {
        role: "tool" as const,
        toolCallId: functionCall.toolCallId || msg.toolCallId,
        name: functionCall.name,
        content: typeof result === "string" ? result : JSON.stringify(result),
      },
    });
  } catch (err) {
    console.error("Error handling VAPI function call:", err);
    try {
      vapiInstance.send({
        type: "add-message",
        message: {
          role: "tool" as const,
          toolCallId: functionCall.toolCallId || msg.toolCallId,
          name: functionCall.name,
          content: JSON.stringify({
            error: true,
            message:
              "İşlem sırasında bir teknik sorun oluştu ama mülakat devam edebilir. Lütfen devam edin.",
          }),
        },
      });
    } catch (sendErr) {
      console.error("Failed to send error response to VAPI:", sendErr);
    }
  }
}
