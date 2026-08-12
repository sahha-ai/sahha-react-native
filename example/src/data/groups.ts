import {
  SahhaBiomarkerCategory,
  SahhaBiomarkerType,
  SahhaScoreType,
  SahhaSensor,
} from 'sahha-react-native';

/**
 * Buckets the long SDK enums into readable groups for the pickers and the
 * diagnostics screen. Ported from the Sahha Flutter example app
 * (`widgets/sensor_groups.dart` and the helpers at the bottom of
 * `Views/BiomarkersView.dart`), with the Dart index arithmetic replaced by
 * explicit membership lists because the React Native enums are string enums.
 */

/** Every sensor, in declaration order. */
const ALL_SENSORS: readonly SahhaSensor[] = Object.values(SahhaSensor);

const ACTIVITY_SENSORS: ReadonlySet<SahhaSensor> = new Set<SahhaSensor>([
  SahhaSensor.steps,
  SahhaSensor.floors_climbed,
  SahhaSensor.active_energy_burned,
  SahhaSensor.basal_energy_burned,
  SahhaSensor.total_energy_burned,
  SahhaSensor.basal_metabolic_rate,
  SahhaSensor.time_in_daylight,
  SahhaSensor.stand_time,
  SahhaSensor.move_time,
  SahhaSensor.exercise_time,
  SahhaSensor.activity_summary,
  SahhaSensor.exercise,
  SahhaSensor.running_speed,
  SahhaSensor.running_power,
  SahhaSensor.running_ground_contact_time,
  SahhaSensor.running_stride_length,
  SahhaSensor.running_vertical_oscillation,
  SahhaSensor.six_minute_walk_test_distance,
  SahhaSensor.stair_ascent_speed,
  SahhaSensor.stair_descent_speed,
  SahhaSensor.walking_speed,
  SahhaSensor.walking_steadiness,
  SahhaSensor.walking_asymmetry_percentage,
  SahhaSensor.walking_double_support_percentage,
  SahhaSensor.walking_step_length,
]);

const BODY_SENSORS: ReadonlySet<SahhaSensor> = new Set<SahhaSensor>([
  SahhaSensor.height,
  SahhaSensor.weight,
  SahhaSensor.lean_body_mass,
  SahhaSensor.body_mass_index,
  SahhaSensor.body_fat,
  SahhaSensor.body_water_mass,
  SahhaSensor.bone_mass,
  SahhaSensor.waist_circumference,
  SahhaSensor.body_temperature,
  SahhaSensor.basal_body_temperature,
  SahhaSensor.sleeping_wrist_temperature,
]);

const REPRODUCTIVE_SENSORS: ReadonlySet<SahhaSensor> = new Set<SahhaSensor>([
  SahhaSensor.menstrual_flow,
  SahhaSensor.intermenstrual_bleeding,
  SahhaSensor.infrequent_menstrual_cycles,
  SahhaSensor.irregular_menstrual_cycles,
  SahhaSensor.persistent_intermenstrual_bleeding,
  SahhaSensor.prolonged_menstrual_periods,
  SahhaSensor.menstrual_period,
  SahhaSensor.ovulation_test,
  SahhaSensor.cervical_mucus,
  SahhaSensor.sexual_activity,
  SahhaSensor.contraceptive,
  SahhaSensor.pregnancy,
  SahhaSensor.pregnancy_test,
  SahhaSensor.progesterone_test,
  SahhaSensor.lactation,
]);

const SYMPTOM_SENSORS: ReadonlySet<SahhaSensor> = new Set<SahhaSensor>([
  SahhaSensor.abdominal_cramps,
  SahhaSensor.acne,
  SahhaSensor.appetite_changes,
  SahhaSensor.bladder_incontinence,
  SahhaSensor.bloating,
  SahhaSensor.breast_pain,
  SahhaSensor.chest_tightness_or_pain,
  SahhaSensor.chills,
  SahhaSensor.constipation,
  SahhaSensor.coughing,
  SahhaSensor.diarrhea,
  SahhaSensor.dizziness,
  SahhaSensor.dry_skin,
  SahhaSensor.fainting,
  SahhaSensor.fatigue,
  SahhaSensor.fever,
  SahhaSensor.generalized_body_ache,
  SahhaSensor.hair_loss,
  SahhaSensor.headache,
  SahhaSensor.heartburn,
  SahhaSensor.hot_flashes,
  SahhaSensor.loss_of_smell,
  SahhaSensor.loss_of_taste,
  SahhaSensor.lower_back_pain,
  SahhaSensor.memory_lapse,
  SahhaSensor.mood_changes,
  SahhaSensor.nausea,
  SahhaSensor.night_sweats,
  SahhaSensor.pelvic_pain,
  SahhaSensor.rapid_pounding_or_fluttering_heartbeat,
  SahhaSensor.runny_nose,
  SahhaSensor.shortness_of_breath,
  SahhaSensor.sinus_congestion,
  SahhaSensor.skipped_heartbeat,
  SahhaSensor.sleep_changes,
  SahhaSensor.sore_throat,
  SahhaSensor.vaginal_dryness,
  SahhaSensor.vomiting,
  SahhaSensor.wheezing,
]);

/**
 * Readable group for a sensor. Check order matters: symptoms are tested
 * before `sleep` so `sleep_changes` stays a symptom, and nutrition is matched
 * by suffix so future `*_intake` additions land in the right bucket.
 */
export function sensorGroupOf(sensor: SahhaSensor): string {
  if (sensor === SahhaSensor.gender || sensor === SahhaSensor.date_of_birth) {
    return 'Demographic';
  }
  if (sensor.endsWith('_intake')) {
    return 'Nutrition';
  }
  if (SYMPTOM_SENSORS.has(sensor)) {
    return 'Symptoms';
  }
  if (REPRODUCTIVE_SENSORS.has(sensor)) {
    return 'Reproductive';
  }
  if (sensor === SahhaSensor.sleep) {
    return 'Sleep';
  }
  if (sensor === SahhaSensor.device_lock) {
    return 'Device';
  }
  if (ACTIVITY_SENSORS.has(sensor)) {
    return 'Activity & Mobility';
  }
  if (BODY_SENSORS.has(sensor)) {
    return 'Body';
  }
  return 'Vitals';
}

/**
 * Buckets a biomarker type into a readable group. Order matters: the vitals
 * check runs before the body check so `body_temperature_basal` stays with the
 * other temperatures, and the sleep check only matches the `sleep_` prefix so
 * `heart_rate_sleep` and friends stay in vitals. `Other` is a safety net for
 * values added to the SDK later.
 */
export function biomarkerTypeGroupOf(type: SahhaBiomarkerType): string {
  const name: string = type;
  const startsWithAny = (prefixes: readonly string[]): boolean =>
    prefixes.some((prefix) => name.startsWith(prefix));

  if (name.startsWith('sleep_')) {
    return 'Sleep';
  }
  if (
    startsWithAny([
      'heart_',
      'respiratory',
      'oxygen',
      'blood_',
      'vo2',
      'body_temperature',
      'skin_temperature',
    ])
  ) {
    return 'Vitals';
  }
  if (
    startsWithAny([
      'steps',
      'floors_climbed',
      'active_',
      'activity_',
      'total_energy_burned',
    ])
  ) {
    return 'Activity';
  }
  if (
    startsWithAny([
      'height',
      'weight',
      'body_',
      'fat_mass',
      'lean_mass',
      'waist_circumference',
      'resting_energy_burned',
    ])
  ) {
    return 'Body';
  }
  if (startsWithAny(['age', 'biological_sex', 'date_of_birth'])) {
    return 'Demographic';
  }
  return 'Other';
}

/**
 * Values in declaration order, sorted so each group is contiguous. Groups
 * appear in the order their first member appears in the enum.
 */
function groupedInEnumOrder<T extends string>(
  values: readonly T[],
  groupOf: (value: T) => string
): readonly T[] {
  const byGroup = new Map<string, T[]>();
  for (const value of values) {
    const group = groupOf(value);
    const bucket = byGroup.get(group);
    if (bucket) {
      bucket.push(value);
    } else {
      byGroup.set(group, [value]);
    }
  }
  const ordered: T[] = [];
  for (const bucket of byGroup.values()) {
    ordered.push(...bucket);
  }
  return ordered;
}

/** Every sensor, ordered so that each `sensorGroupOf` group is contiguous. */
export const SENSORS_GROUPED: readonly SahhaSensor[] = groupedInEnumOrder(
  ALL_SENSORS,
  sensorGroupOf
);

/** Every biomarker type, ordered so each `biomarkerTypeGroupOf` group is contiguous. */
export const BIOMARKER_TYPES_GROUPED: readonly SahhaBiomarkerType[] =
  groupedInEnumOrder(
    Object.values(SahhaBiomarkerType) as readonly SahhaBiomarkerType[],
    biomarkerTypeGroupOf
  );

export const ALL_BIOMARKER_CATEGORIES: readonly SahhaBiomarkerCategory[] =
  Object.values(SahhaBiomarkerCategory);

export const ALL_SCORE_TYPES: readonly SahhaScoreType[] =
  Object.values(SahhaScoreType);

/**
 * Sensible starting set for the diagnostics screen: the sensors most likely
 * to be available on a real device, so the first run shows a useful spread of
 * statuses without querying all 144 sensors.
 */
export const DEFAULT_DIAGNOSTIC_SENSORS: readonly SahhaSensor[] = [
  SahhaSensor.sleep,
  SahhaSensor.steps,
  SahhaSensor.heart_rate,
  SahhaSensor.resting_heart_rate,
  SahhaSensor.heart_rate_variability_sdnn,
  SahhaSensor.active_energy_burned,
  SahhaSensor.floors_climbed,
  SahhaSensor.exercise,
];

/**
 * Curated sensor subset used by the permissions screen: steps, sleep, the
 * full reproductive group and the full nutrition group. Each sensor here maps
 * to a Health Connect READ permission declared in
 * `example/android/app/src/main/AndroidManifest.xml`.
 */
export const DEFAULT_PERMISSION_SENSORS: readonly SahhaSensor[] = [
  SahhaSensor.steps,
  SahhaSensor.sleep,

  // Reproductive
  SahhaSensor.menstrual_flow,
  SahhaSensor.menstrual_period,
  SahhaSensor.intermenstrual_bleeding,
  SahhaSensor.infrequent_menstrual_cycles,
  SahhaSensor.irregular_menstrual_cycles,
  SahhaSensor.persistent_intermenstrual_bleeding,
  SahhaSensor.prolonged_menstrual_periods,
  SahhaSensor.ovulation_test,
  SahhaSensor.cervical_mucus,
  SahhaSensor.sexual_activity,
  SahhaSensor.contraceptive,
  SahhaSensor.pregnancy,
  SahhaSensor.pregnancy_test,
  SahhaSensor.progesterone_test,
  SahhaSensor.lactation,

  // Nutrition
  SahhaSensor.energy_intake,
  SahhaSensor.protein_intake,
  SahhaSensor.fat_intake,
  SahhaSensor.fat_saturated_intake,
  SahhaSensor.fat_monounsaturated_intake,
  SahhaSensor.fat_polyunsaturated_intake,
  SahhaSensor.cholesterol_intake,
  SahhaSensor.carbohydrate_intake,
  SahhaSensor.sugar_intake,
  SahhaSensor.fiber_intake,
  SahhaSensor.vitamin_a_intake,
  SahhaSensor.vitamin_c_intake,
  SahhaSensor.vitamin_d_intake,
  SahhaSensor.vitamin_e_intake,
  SahhaSensor.vitamin_k_intake,
  SahhaSensor.vitamin_b6_intake,
  SahhaSensor.vitamin_b12_intake,
  SahhaSensor.thiamin_intake,
  SahhaSensor.riboflavin_intake,
  SahhaSensor.niacin_intake,
  SahhaSensor.pantothenic_acid_intake,
  SahhaSensor.folate_intake,
  SahhaSensor.biotin_intake,
  SahhaSensor.calcium_intake,
  SahhaSensor.iron_intake,
  SahhaSensor.magnesium_intake,
  SahhaSensor.phosphorus_intake,
  SahhaSensor.potassium_intake,
  SahhaSensor.sodium_intake,
  SahhaSensor.zinc_intake,
  SahhaSensor.chloride_intake,
  SahhaSensor.copper_intake,
  SahhaSensor.manganese_intake,
  SahhaSensor.chromium_intake,
  SahhaSensor.molybdenum_intake,
  SahhaSensor.selenium_intake,
  SahhaSensor.iodine_intake,
  SahhaSensor.caffeine_intake,
  SahhaSensor.water_intake,
];

/** `heart_rate_variability_sdnn` -> `Heart rate variability sdnn`. */
export function prettyLabel(value: string): string {
  const words = value.replace(/_/g, ' ').trim();
  if (words.length === 0) {
    return value;
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}
