export async function withProcessRetry<T, E>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown) => error is E,
  options: { attempts?: number; delayMs?: number; onRetry?: (error: E, attempt: number) => void } = {},
): Promise<T> {
  const attempts = options.attempts ?? 2;
  const delayMs = options.delayMs ?? 180;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === attempts - 1) throw error;
      options.onRetry?.(error, attempt + 1);
      if (delayMs > 0) await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
