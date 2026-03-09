/**
 * Helpers for reading versioned JSONB data stored in plan/workout rows.
 * Both functions are backwards-compatible with the old flat format so that
 * plans created before the versioning migration continue to work unchanged.
 */

/**
 * Reads the exercise list from a workout row's `exercises` JSONB column.
 *
 * Versioned format:
 *   [{ label, effective_from: "YYYY-MM-DD", exercises: [...] }, ...]
 *
 * Legacy flat format:
 *   [{ exercise_id, sets, reps, ... }, ...]
 *
 * @param exercises  Raw value from workouts.exercises
 * @param forDate    "YYYY-MM-DD" — returns the version active on that date.
 *                   Defaults to today when omitted.
 */
export function getActiveVersion(exercises: any[], forDate?: string): any[] {
  if (!exercises || exercises.length === 0) return [];
  if (exercises[0]?.label !== undefined) {
    // Build a comparable ISO string. New edits use full datetimes; old entries and
    // forDate callers may use date-only strings. Normalise both so comparisons work:
    //   - date-only forDate ("2026-03-08")  → treat as end of that day
    //   - no forDate                        → current instant
    let compareTo: string;
    if (forDate) {
      compareTo = forDate.includes('T') ? forDate : `${forDate}T23:59:59.999Z`;
    } else {
      compareTo = new Date().toISOString();
    }
    // A date-only effective_from ("2026-03-08") compares correctly because
    // "2026-03-08" < "2026-03-08T..." lexicographically — it is always eligible
    // for any compareTo that is on or after that date.
    const eligible = exercises.filter((v: any) => v.effective_from <= compareTo);
    if (eligible.length === 0) return exercises[0].exercises ?? [];
    eligible.sort((a: any, b: any) => b.effective_from.localeCompare(a.effective_from));
    return eligible[0].exercises ?? [];
  }
  return exercises;
}

/**
 * Reads a single field from a versioned config array stored in plans.config.
 *
 * @param versions   Array of { effective_from: "YYYY-MM-DD", [field]: value }
 * @param field      The key to extract from the matching version entry
 * @param forDate    "YYYY-MM-DD". Defaults to today.
 */
export function getActiveConfigValue(versions: any[] | undefined, field: string, forDate?: string): any {
  if (!versions || versions.length === 0) return undefined;
  const dateStr = forDate ?? new Date().toISOString().split('T')[0];
  const eligible = versions.filter((v: any) => v.effective_from <= dateStr);
  if (eligible.length === 0) return versions[0][field];
  eligible.sort((a: any, b: any) => b.effective_from.localeCompare(a.effective_from));
  return eligible[0][field];
}
