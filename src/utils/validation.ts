import { Validator } from "node-input-validator";
import { DataValidationError } from "../errors/DataValidationError";

export const validate = async (body: Record<string, any>, schema: Record<string, string>) => {
  const validationObject = Object.fromEntries(Object.keys(schema).map((key) => [key, body[key] ?? null]));

  const validator = new Validator(validationObject, schema);
  const matched = await validator.check();

  if (!matched) throw new DataValidationError("Input validatie mislukt.");

  return validationObject;
};
