import * as z from "zod";

export const demoAiAppEnvSchema = z.object({
  OPENAI_API_KEY: z.string().default(""),
});
