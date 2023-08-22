import { DataValidationError } from "@/errors/DataValidationError";
import type { Request } from "express";
import { AnyZodObject, z, ZodError } from "zod";

export async function zParse<T extends AnyZodObject>(schema: T, req: Request): Promise<z.infer<T>> {
  try {
    return schema.parseAsync(req);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new DataValidationError("Foute gegevens meegegeven.");
    }
    throw new DataValidationError("Foute gegevens meegegeven.");
  }
}
