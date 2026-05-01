import type { Response } from "express";

export type JsonResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export default class ResponseWriter {
  static ok<T>(res: Response, data: T, status = 200) {
    const body: JsonResponse<T> = { success: true, data };
    res.status(status).json(body);
  }

  static created<T>(res: Response, data: T) {
    return ResponseWriter.ok(res, data, 201);
  }

  static badRequest(res: Response, message: string, code = "BAD_REQUEST") {
    const body: JsonResponse<never> = {
      success: false,
      error: { code, message },
    };
    res.status(400).json(body);
  }

  static notFound(res: Response, message = "Resource not found") {
    const body: JsonResponse<never> = {
      success: false,
      error: { code: "NOT_FOUND", message },
    };
    res.status(404).json(body);
  }

  static unauthorized(res: Response, message = "You are not authorized") {
    const body: JsonResponse<never> = {
      success: false,
      error: { code: "UNAUTHORIZED", message },
    };
    res.status(401).json(body);
  }

  static serverError(res: Response, message = "Internal server error") {
    const body: JsonResponse<never> = {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message },
    };
    res.status(500).json(body);
  }
}
