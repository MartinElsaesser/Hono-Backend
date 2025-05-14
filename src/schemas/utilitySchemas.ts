import z from "zod";

export const positiveIntSchema = z
  .number()
  .int()
  .positive()
  .safe();

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
