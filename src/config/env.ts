import "dotenv/config";
import z from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	DATABASE_URL: z.string().url(),
});

export const envs = envSchema.parse(process.env);
