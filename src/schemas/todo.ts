import { z } from "zod";

export const todoSchema = z.object({
  created_at: z.date().optional(),
  description: z.string(),
  done: z.boolean(),
  headline: z.string(),
  id: z
    .number()
    .int()
    .positive()
    .optional(),
  position: z
    .number()
    .int()
    .positive()
    .optional(),
});
