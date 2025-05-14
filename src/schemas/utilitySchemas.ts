import z from "zod";

export const parsePositiveIntSchema = z
  .string()
  .regex(/^-?\d+$/)
  .pipe(
    z.coerce
      .number()
      .int()
      .positive()
      .safe()
  );
const parseIntSchema = z
  .string()
  .regex(/^-?\d+$/)
  .pipe(
    z.coerce
      .number()
      .int()
      .safe()
  );
