/**
 * Handles VAPI function-call messages by forwarding to the backend webhook
 * and sending results back to the VAPI instance.
 *
 * Stateless — receives setters as arguments to avoid stale closure bugs.
 */

import type Vapi from "@vapi-ai/web";
import api from "@/lib/axios";

export interface VapiStateSetters {
  setInterviewId: (id: string) => void;
  setCurrentQuestion: (q: string) => void;
  setOverallScore: (score: number) => void;
}

/**
 * Process an incoming VAPI function-call message.
 * Forwards to backend, updates local state, and sends the result back to VAPI.
 */
export async function handleVapiFunctionCall(
  msg: any,
  vapiInstance: Vapi,
  setters: VapiStateSetters,
): Promise<void> {
  const { functionCall } = msg;
  if (!functionCall) return;

  try {
    // 1. Forward to backend webhook
    const response = await api.post("/ai/vapi/webhook", { message: msg });
    const data = response.data;
    const result = data.result || {};

    // 2. Update local state based on function name
    switch (functionCall.name) {
      case "save_preferences": {
        if (result.interviewId) {
          setters.setInterviewId(result.interviewId);
        }
        if (result.firstQuestion) {
          setters.setCurrentQuestion(result.firstQuestion);
        }
        break;
      }

      case "save_answer": {
        // Backend now returns nextQuestion directly — no client-side lookup needed
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

    // 3. Send result back to VAPI so the AI can continue the conversation
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
  }
}
