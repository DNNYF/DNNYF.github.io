import { z } from "zod";

export const llmConfigSchema = z.object({
  system_prompt: z.string().max(5000, "System prompt cannot exceed 5000 characters.").optional().default(""),
  max_tokens: z.coerce.number().int().min(1).max(8192),
  temperature: z.coerce.number().min(0).max(2),
  top_k: z.coerce.number().int().min(1),
  top_p: z.coerce.number().min(0).max(1),
  repeat_penalty: z.coerce.number().min(1).max(2),
  stop: z.array(z.string()).max(4, "You can specify up to 4 stop sequences.").optional().default(['<end_of_turn>']),
});

export type LlmConfig = z.infer<typeof llmConfigSchema>;
