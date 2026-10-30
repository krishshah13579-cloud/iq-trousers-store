/**
 * Executes a database query with a fast timeout fallback so pages never hang
 * waiting on remote network latency or unresponsive database instances.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs: number = 3000
): Promise<T> {
  // During build phase, do not wait for remote DB timeouts
  if (
    process.env.npm_lifecycle_event === "build" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return fallback;
  }

  let timerId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timerId = setTimeout(() => {
      console.warn(`[DB TIMEOUT] Query exceeded ${timeoutMs}ms, using fallback.`);
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timerId) clearTimeout(timerId);
    return result;
  } catch (error) {
    if (timerId) clearTimeout(timerId);
    console.error("[DB ERROR]", error);
    return fallback;
  }
}
