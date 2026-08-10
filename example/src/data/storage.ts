import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Every AsyncStorage key the harness writes. Screens share these constants so
 * a rename never silently orphans a stored value.
 */
export const StorageKeys = {
  appId: 'auth.appId',
  appSecret: 'auth.appSecret',
  externalId: 'auth.externalId',
  biomarkerCategories: 'biomarkers.categories',
  biomarkerTypes: 'biomarkers.types',
  scoreTypes: 'scores.types',
  statsSensor: 'stats.sensor',
  samplesSensor: 'samples.sensor',
  permissionSensors: 'permissions.sensors',
  diagnosticsSensors: 'diagnostics.sensors',
} as const;

/**
 * Keys written by the previous single-file example app. Reads fall back to
 * these so an existing install keeps its credentials after the rebuild.
 */
const LEGACY_KEYS: Readonly<Record<string, string>> = {
  [StorageKeys.appId]: '@sahha_example/appId',
  [StorageKeys.appSecret]: '@sahha_example/appSecret',
  [StorageKeys.externalId]: '@sahha_example/externalId',
};

/**
 * Reads a string, falling back to the legacy key when the new one is empty.
 * Storage failures resolve to null — a broken AsyncStorage must never take
 * down the harness.
 */
export async function loadString(key: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    const legacyKey = LEGACY_KEYS[key];
    if (legacyKey === undefined) {
      return null;
    }
    return await AsyncStorage.getItem(legacyKey);
  } catch {
    return null;
  }
}

/** Writes a string, ignoring storage failures. */
export async function saveString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Ignore write errors; the in-memory value is still used this session.
  }
}

/**
 * Reads a JSON string array and keeps only the names still present in
 * [valid]. Returns null when nothing is stored, the payload is unusable, or
 * every stored name is unknown — in each case the caller keeps its defaults.
 */
export async function loadEnumList<T extends string>(
  key: string,
  valid: readonly T[]
): Promise<T[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set<string>(valid);
    const values = parsed.filter(
      (entry): entry is T => typeof entry === 'string' && allowed.has(entry)
    );
    return values.length > 0 ? values : null;
  } catch {
    return null;
  }
}

/** Writes a list of enum names as a JSON string array. */
export async function saveEnumList(
  key: string,
  values: readonly string[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Ignore write errors; the in-memory selection is still used this session.
  }
}
