// An app that compiles with `strict` must be able to call the SDK the way the
// README does: on the default export, with no `?.` or `!`.
//
// - `yarn typecheck` checks this file against src/, through the root
//   tsconfig's `paths` entry.
// - `yarn typecheck:consumer` checks it against the built typings in lib/,
//   resolved through package.json "exports" as an installed app would. Run
//   `yarn prepare` first.
import Sahha, {
  SahhaBiomarkerCategory,
  SahhaBiomarkerType,
  SahhaEnvironment,
  SahhaScoreType,
  SahhaSensor,
  SahhaSensorStatus,
} from 'sahha-react-native';

const results: unknown[] = [];

const settings = {
  environment: SahhaEnvironment.sandbox,
};

Sahha.configure(settings, (error: string, success: boolean) => {
  results.push(error || success);
});

Sahha.isAuthenticated((error: string, success: boolean) => {
  results.push(error || success);
});

Sahha.authenticate(
  'APP_ID',
  'APP_SECRET',
  'EXTERNAL_ID',
  (error: string, success: boolean) => {
    results.push(error || success);
  }
);

Sahha.authenticateToken(
  'PROFILE_TOKEN',
  'REFRESH_TOKEN',
  (error: string, success: boolean) => {
    results.push(error || success);
  }
);

Sahha.deauthenticate((error: string, success: boolean) => {
  results.push(error || success);
});

Sahha.getProfileToken((error: string, profileToken?: string) => {
  results.push(error || profileToken);
});

Sahha.getDemographic((error: string, demographic?: string) => {
  results.push(error || demographic);
});

Sahha.postDemographic(
  { gender: 'female' },
  (error: string, success: boolean) => {
    results.push(error || success);
  }
);

const sensors = [SahhaSensor.steps, SahhaSensor.sleep];

Sahha.getSensorStatus(sensors, (error: string, value: SahhaSensorStatus) => {
  results.push(error || value === SahhaSensorStatus.enabled);
});

Sahha.enableSensors(sensors, (error: string, value: SahhaSensorStatus) => {
  results.push(error || value === SahhaSensorStatus.enabled);
});

const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);

Sahha.getScores(
  [SahhaScoreType.activity, SahhaScoreType.sleep],
  startDate.getTime(),
  endDate.getTime(),
  (error: string, value: string) => {
    results.push(error || value);
  }
);

Sahha.getBiomarkers(
  [SahhaBiomarkerCategory.activity, SahhaBiomarkerCategory.sleep],
  [SahhaBiomarkerType.steps, SahhaBiomarkerType.sleep_duration],
  startDate.getTime(),
  endDate.getTime(),
  (error: string, value: string) => {
    results.push(error || value);
  }
);

Sahha.getStats(
  SahhaSensor.steps,
  startDate.getTime(),
  endDate.getTime(),
  (error: string, value: string) => {
    results.push(error || value);
  }
);

Sahha.getSamples(
  SahhaSensor.steps,
  startDate.getTime(),
  endDate.getTime(),
  (error: string, value: string) => {
    results.push(error || value);
  }
);

Sahha.openAppSettings();

Sahha.postSensorData();
