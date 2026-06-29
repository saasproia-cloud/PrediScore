import type { ZodSchema } from "zod";

export class RequestBodyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  maxBytes = 24_000,
): Promise<T> {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    throw new RequestBodyError("Requête trop volumineuse.", 413);
  }

  const text = await req.text();
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > maxBytes) {
    throw new RequestBodyError("Requête trop volumineuse.", 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(text || "{}");
  } catch {
    throw new RequestBodyError("JSON invalide.", 400);
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new RequestBodyError("Requête invalide.", 400);
  }
  return result.data;
}

export function trimParam(value: string | null, max = 80): string | undefined {
  const v = value?.trim().replace(/\s+/g, " ").slice(0, max);
  return v ? v : undefined;
}
