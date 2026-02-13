// ════════════════════════════════════════════
// Validation Middleware
// Validates request payloads against Zod schemas
// ════════════════════════════════════════════

import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  response: NextResponse;
}

/**
 * Validates a request body against a Zod schema
 * Returns either validated data or an error response
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates URL search params against a Zod schema
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> | ValidationError {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Invalid query parameters",
            details: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      ),
    };
  }
}
