import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

export const SYSTEM_TEACHER = `Você é a DECIFRA IA, assistente da plataforma WW DECIFRA (lema: "Não decore. Decifre."), um professor particular brasileiro especialista em ENEM, vestibulares e concursos.
Regras: ensine de verdade (explique o raciocínio, use exemplos simples, faça perguntas de verificação), não apenas entregue respostas.
Adapte a linguagem ao nível do estudante. Use português do Brasil e Markdown.
Nunca invente estatísticas, anos de prova, números de questões oficiais ou editais. Se não tiver certeza de um dado factual, diga isso.
Diferencie recorrência histórica de previsão: nunca garanta que um assunto cairá.`;

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}

export async function askAI(instructions: string, input: Array<{ role: "user" | "assistant"; content: string }> | string, json = false) {
  try {
    const items = typeof input === "string" ? [{ role: "user" as const, content: input }] : input;
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions,
      input: items.map((m) =>
        m.role === "assistant"
          ? { role: "assistant" as const, content: [{ type: "output_text" as const, text: m.content, annotations: [] }] }
          : { role: "user" as const, content: m.content },
      ) as never,
      ...(json ? { text: { format: { type: "json_object" as const } } } : {}),
    });
    return extractText(res);
  } catch (e) {
    if (e instanceof GatewayError) {
      if (e.httpStatus === 429) throw new Error("Muitas solicitações à IA. Aguarde um instante e tente novamente.");
      if (e.httpStatus === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error("A IA não respondeu agora. Tente novamente em instantes.");
    }
    throw e;
  }
}

export function parseJSON<T>(text: string): T {
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text) as T;
}
