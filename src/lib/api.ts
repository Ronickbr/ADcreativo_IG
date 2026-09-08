export type AiProvider = "gemini" | "openrouter";
export type AiMode = "copy" | "image";

interface AiImage { mimeType: string; data: string }
interface GenerateInput {
  provider: AiProvider;
  mode: AiMode;
  model: string;
  apiKey?: string;
  prompt: string;
  images: AiImage[];
  aspectRatio?: string;
}

export async function requestAi(input: GenerateInput) {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Erro de IA (${response.status}).`);
  return data as { text: string; imageUrl: string | null };
}

export function parseJsonResponse<T>(content: string): T {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  try { return JSON.parse(fenced?.[1] || content); }
  catch { throw new Error("A IA retornou uma resposta incompleta. Tente gerar novamente."); }
}
