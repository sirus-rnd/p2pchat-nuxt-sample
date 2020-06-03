import { DateTime } from 'luxon';

/**
 * Ago filter
 *
 * @export
 * @param {Date} value
 */
export function AgoFilter(value: Date): string {
  if (!value) {
    return '';
  }
  return DateTime.fromJSDate(new Date(value)).toRelative();
}
