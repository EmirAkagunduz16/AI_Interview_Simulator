import apiClient from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
}

export interface ChatResponse {
  message: string;
}

export interface EvaluateRequest {
  questionText: string;
  questionType: string;
  answer: string;
  aiPrompt?: string;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface GenerateQuestionRequest {
  field: string;
  questionType: string;
  difficulty: string;
  previousQuestions?: string[];
}

export interface GenerateQuestionResponse {
  question: string;
}

export const aiApi = {
  chat: (data: ChatRequest) =>
    apiClient.post<ChatResponse>('/ai/chat', data),

  evaluate: (data: EvaluateRequest) =>
    apiClient.post<EvaluationResult>('/ai/evaluate', data),

  textToSpeech: async (text: string): Promise<Blob> => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/ai/tts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      }
    );
    if (!response.ok) throw new Error('TTS failed');
    return response.blob();
  },

  generateQuestion: (data: GenerateQuestionRequest) =>
    apiClient.post<GenerateQuestionResponse>('/ai/generate-question', data),
};

export default aiApi;
