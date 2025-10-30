/**
 *
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 *
 * @param date
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 *
 * @param dateString
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 *
 * @param text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\s\w-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 *
 * @param text
 * @param maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 *
 * @param ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 *
 * @param fn
 * @param maxAttempts
 * @param delay
 */
export function retry<T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
  let attempt = 0;

  /**
   *
   */
  async function attemptFn(): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      await sleep(delay * attempt);
      return attemptFn();
    }
  }

  return attemptFn();
}
