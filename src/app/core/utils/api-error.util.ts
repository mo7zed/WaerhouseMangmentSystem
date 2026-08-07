/** Extract a user-facing message from ASP.NET ProblemDetails / validation responses. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    error?: {
      message?: string;
      title?: string;
      detail?: string;
      errors?: Record<string, string[]>;
    };
    message?: string;
  };

  const errors = e?.error?.errors;
  if (errors && typeof errors === 'object') {
    const lines = Object.entries(errors).flatMap(([field, msgs]) =>
      (msgs ?? []).map((m) => `${field}: ${m}`)
    );
    if (lines.length) return lines.join('\n');
  }

  return (
    e?.error?.detail ||
    e?.error?.message ||
    e?.error?.title ||
    e?.message ||
    fallback
  );
}
