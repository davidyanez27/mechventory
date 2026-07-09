import axios from "axios";

export interface ApiError {
  title: string;
  detail: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Extracts a user-friendly error from the backend Problem response.
 *
 * Backend shape: `{ type, title, status, detail?, errors?: { form?, fields? } }`
 */
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    return {
      title: data.title ?? "Request failed",
      detail: data.detail ?? "An unexpected error occurred.",
      status: data.status ?? error.response.status,
      fieldErrors: data.errors?.fields,
    };
  }

  if (error instanceof Error) {
    return { title: "Error", detail: error.message, status: 0 };
  }

  return { title: "Error", detail: "An unexpected error occurred.", status: 0 };
}
