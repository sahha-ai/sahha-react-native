# Sahha SDK for React Native Apps

The Sahha SDK provides a convenient way for React Native apps to connect to the Sahha API.

Sahha lets your project seamlessly collect health and lifestyle data from smartphones and wearables
via Apple Health, Google Health Connect, and a variety of other sources.

For more information on Sahha please visit https://sahha.ai.

---

## Docs

The Sahha Docs provide detailed instructions for installation and usage of the Sahha SDK.

[Sahha Docs](https://docs.sahha.ai)

---

## Example

The Sahha Demo App provides a convenient way to try the features of the Sahha SDK.

[Sahha Demo App](https://github.com/sahha-ai/sahha-react-native/tree/main/example)

---

## Health Data Source Integrations

Sahha supports integration with the following health data sources:

- [Apple Health Kit](https://sahha.notion.site/Apple-Health-HealthKit-13cb2f553bbf80c0b117cb662e04c257?pvs=25)
- [Google Fit](https://sahha.notion.site/Google-Fit-131b2f553bbf804a8ee6fef7bc1f4edb?pvs=25)
- [Google Health Connect](https://sahha.notion.site/Health-Connect-Android-13cb2f553bbf806d9d64e79fe9d07d9e?pvs=25)
- [Samsung Health](https://sahha.notion.site/Samsung-Health-d3f76840fad142469f5e724a54c24ead?pvs=25)
- [Fitbit](https://sahha.notion.site/Fitbit-12db2f553bbf809fa93ff01f9acd7330?pvs=25)
- [Garmin Connect](https://sahha.notion.site/Garmin-12db2f553bbf80afb916d04a62e857e6?pvs=25)
- [Polar Flow](https://sahha.notion.site/Polar-12db2f553bbf80c3968eeeab55b484a2?pvs=25)
- [Withings Health Mate](https://sahha.notion.site/Withings-12db2f553bbf80a38d31f80ab083613f?pvs=25)
- [Oura Ring](https://sahha.notion.site/Oura-12db2f553bbf80cf96f2dfd8343b4f06?pvs=25)
- [Whoop](https://sahha.notion.site/WHOOP-12db2f553bbf807192a5c69071e888f4?pvs=25)
- [Strava](https://sahha.notion.site/Strava-12db2f553bbf80c48312c2bf6aa5ac65?pvs=25)
- [Sleep as Android](https://sahha.notion.site/Sleep-as-Android-Smart-alarm-131b2f553bbf802eb7e4dca6baab1049?pvs=25)

& many more! Please visit
our [integrations](https://sahha.notion.site/data-integrations?v=17eb2f553bbf80e0b0b3000c0983ab01)
page for more information.

---

## Install

```bash
npm install sahha-react-native
```

### Android

In the `AndroidManifest.xml` file, which can be found in `android` > `app` > `src` > `main`, declare
Google Health Connect data types if required, e.g. sleep and step count.

More data types are available such as heart rate, workout / exercise, please refer to the links
below for more information.

```xml
<!-- Sleep -->
<uses-permission android:name="android.permission.health.READ_SLEEP" />

  <!-- Activity -->
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_FLOORS_CLIMBED" />
```

This is recommended if you'd like to retrieve Health Connect data from other health apps such as
WHOOP, Garmin, Samsung Health etc.

To declare other sensor permissions, please refer
to [this](https://docs.sahha.ai/docs/data-flow/sdk/setup#step-2-review-sensor-permissions) page.

Only include the sensor permissions required by your project, what is declared here will be reviewed
by the Play Store.

You must be able to justify reasons behind requiring the sensor
permissions, [these](https://docs.sahha.ai/docs/data-flow/sdk/app-store-submission/google-play-store#data-type-justifications)
justifications may be used to clearly articulate the reasoning behind your required sensor
permissions.

### Apple iOS

#### Enable HealthKit

- Open your project in Xcode and select your `App Target` in the Project panel.
- Navigate to the `Signing & Capabilities` tab.
- Click the `+` button (or choose `Editor > Add Capability`) to open the Capabilities library.
- Locate and select `HealthKit`; double-click it to add it to your project.

#### Background Delivery

- Select your project in the Project navigator and choose your app’s target.
- In the `Signing & Capabilities` tab, find the HealthKit capability.
- Enable the nested `Background Delivery` option to allow passive health data collection.

#### Add Usage Descriptions

- Select your `App Target` and navigate to the `Info` tab.
- Click the `+` button to add a new key and choose `Privacy - Health Share Usage Description`.
- Provide a clear description, such as: "*This app needs your health info to deliver mood
  predictions*."

For more detailed instructions, refer to
our [setup guide](https://docs.sahha.ai/docs/data-flow/sdk/setup#minimum-requirements).

---

## API

<docgen-index>

* [`configure(...)`](#configure)
* [`isAuthenticated(...)`](#isauthenticated)
* [`authenticate(...)`](#authenticate)
* [`authenticateToken(...)`](#authenticatetoken)
* [`deauthenticate(...)`](#deauthenticate)
* [`getProfileToken(...)`](#getprofiletoken)
* [`getDemographic(...)`](#getdemographic)
* [`postDemographic(...)`](#postdemographic)
* [`getSensorStatus(...)`](#getsensorstatus)
* [`enableSensors(...)`](#enablesensors)
* [`getScores(...)`](#getscores)
* [`getBiomarkers(...)`](#getbiomarkers)
* [`getStats(...)`](#getstats)
* [`getSamples(...)`](#getsamples)
* [`openAppSettings()`](#openappsettings)
* [Enums](#enums)

</docgen-index>

<docgen-api>

### configure(...)

```
configure(
    settings: Object,
    callback: (error: string, success: boolean) => void
): void;
```

**Example usage**:

```
const settings = {
    environment: SahhaEnvironment.sandbox,
};

Sahha.configure(settings, (error: string, success: boolean) => {
    if (error) console.error(error);
    console.log(success);
});
```

---

### isAuthenticated(...)

```
isAuthenticated(callback: (error: string, success: boolean) => void): void;
```

**Example usage**:

```
Sahha.isAuthenticated((error: string, success: boolean) => {
    if (error) console.error(error)

    if (success == false) {
      // Consider authenticating the user
     }
});
```

---

### authenticate(...)

```
authenticate(
    appId: string,
    appSecret: string,
    externalId: string,
    callback: (error: string, success: boolean) => void
): void;
```

**Example usage**:

```
Sahha.authenticate(
    APP_ID,
    APP_SECRET,
    EXTERNAL_ID, // Some unique identifier for the user
    (error: string, success: boolean) => {
        if (error) console.error(error);
        console.log(success);
    }
);
```

---

### authenticateToken(...)

```
authenticateToken(
    profileToken: string,
    refreshToken: string,
    callback: (error: string, success: boolean) => void
): void;
```

**Example usage**:

```
Sahha.authenticateToken(
    PROFILE_TOKEN,
    REFRESH_TOKEN,
    (error: string, success: boolean) => {
        if (error) console.error(error);
        console.log(success);
    }
);
```

---

### deauthenticate(...)

```
deauthenticate(callback: (error: string, success: boolean) => void): void;
```

**Example usage*:

```
Sahha.deauthenticate((error: string, success: boolean) => {
    if (success) {
        // E.g. continue logic for successful deauthentication
    }

    if (error) console.error(error);
});
```

---

### getProfileToken(...)

```
getProfileToken(
    callback: (error: string, profileToken?: string) => void
): void;
```

**Example usage**:

```
Sahha.getProfileToken((error: string, profileToken?: string) => {
    if (profileToken) {
        // Do something with the token
    }

    if (error) console.error(error);
});
```

---

### getDemographic(...)

```
getDemographic(callback: (error: string, demographic?: string) => void): void;
```

**Example usage**:

```
Sahha.getDemographic((error: string, demographic?: string) => {
    if (error) console.error(error);
    console.log(demographic);
});
```

---

### postDemographic(...)

```
postDemographic(
    demographic: Object,
    callback: (error: string, success: boolean) => void
  ): void;
```

**Example usage**:

```
const demographic: Object = {
      age: 123,
      gender: 'Male',
};

Sahha.postDemographic(demographic, (error: string, success: boolean) => {
    if (error) console.error(error);
    console.log(success);
});
```

---

### getSensorStatus(...)

```
getSensorStatus(
    sensors: Array<SahhaSensor>,
    callback: (error: string, value: SahhaSensorStatus) => void
): void;
```

**Example usage**:

```
const sensors = [
    SahhaSensor.steps,
    SahhaSensor.sleep
];

Sahha.getSensorStatus(
    sensors,
    (error: string, value: SahhaSensorStatus) => {
        if (error) console.error(error);
        console.log(value);
    }
);
```

---

### enableSensors(...)

```
 enableSensors(
    sensors: Array<SahhaSensor>,
    callback: (error: string, value: SahhaSensorStatus) => void
  ): void;
```

**Example usage**:

```
const sensors = [
    SahhaSensor.steps,
    SahhaSensor.sleep
];

Sahha.enableSensors(
    sensors,
    (error: string, value: SahhaSensorStatus) => {
        if (error) console.error(error);
        console.log(value);
    }
);
```

---

### getScores(...)

```
getScores(
    types: Array<SahhaScoreType>,
    startDateTime: number,
    endDateTime: number,
    callback: (error: string, value: string) => void
): void;
```

**Example usage:**

```
// Query for the last 7 days
const startDate = new Date();
const endDate = new Date();
const days = startDate.getDate() - 7;
startDate.setDate(days);

const scoreTypes = [
    SahhaScoreType.activity,
    SahhaScoreType.sleep,
    SahhaScoreType.wellbeing,
];

Sahha.getScores(
    scoreTypes,
    startDate.getTime(),
    endDate.getTime(),
  (error: string, value: string) => {
      if (error) console.error(error);
      console.log(value); // value is in the form of a JSON array
  }
);
```

---

### getBiomarkers(...)

```
getBiomarkers(
  categories: Array<SahhaBiomarkerCategory>,
  types: Array<SahhaBiomarkerType>,
  startDateTime: number,
  endDateTime: number,
  callback: (error: string, value: string) => void
): void;
```

**Example usage**:

```
// Query for the last 7 days
const startDate = new Date();
const endDate = new Date();
const days = startDate.getDate() - 7;
startDate.setDate(days);

const categories = [
    SahhaBiomarkerCategory.activity,
    SahhaBiomarkerCategory.sleep,
    SahhaBiomarkerCategory.vitals,
];

const types = [
    SahhaBiomarkerType.steps,
    SahhaBiomarkerType.sleep_in_bed_duration,
    SahhaBiomarkerType.heart_rate_resting,
    SahhaBiomarkerType.heart_rate_sleep,
];

Sahha.getBiomarkers(
    categories,
    types,
    startDate.getTime(),
    endDate.getTime(),
    (error: string, value: string) => {
        if(error) console.error(error);
        console.log(value); // value is in the form of a JSON array
    }
);
```

---

### getStats(...)

```
getStats(
    sensor: SahhaSensor,
    startDateTime: number,
    endDateTime: number,
    callback: (error: string, value: string) => void
): void;
```

**Example usage**:

```
// Query for the last 7 days
const startDate = new Date();
const endDate = new Date();
const days = startDate.getDate() - 7;
startDate.setDate(days);

Sahha.getStats(
    SahhaSensor.steps,
    startDate.getTime(),
    endDate.getTime(),
    (error: string, value: string) => {
        if (error) console.error(error);
        console.log(value); // value is in the form of a JSON array
    }
);
```

---

### getSamples(...)

```
getSamples(
    sensor: SahhaSensor,
    startDateTime: number,
    endDateTime: number,
    callback: (error: string, value: string) => void
): void;
  ```

**Example usage**:

```
// Query for the last 7 days
const startDate = new Date();
const endDate = new Date();
const days = startDate.getDate() - 7;
startDate.setDate(days);

Sahha.getSamples(
    SahhaSensor.steps,
    startDate.getTime(),
    endDate.getTime(),
    (error: string, value: string) => {
        if (error) console.error(error);
        console.log(value); // value is in the form of a JSON array
  }
);
```

---

### openAppSettings()

```
openAppSettings(): void;
```

**Example usage**:

```
// This method is useful when the user denies permissions multiple times -- where the prompt will no longer show
if (status == SahhaSensorStatus.disabled) {
    Sahha.openAppSettings();
}
```

---

### Enums

#### SahhaEnvironment

```
export enum SahhaEnvironment {
    sandbox = 'sandbox',
    production = 'production',
}
```

#### SahhaSensor

```
export enum SahhaSensor {
    gender = 'gender',
    date_of_birth = 'date_of_birth',
    sleep = 'sleep',
    steps = 'steps',
    floors_climbed = 'floors_climbed',
    heart_rate = 'heart_rate',
    resting_heart_rate = 'resting_heart_rate',
    walking_heart_rate_average = 'walking_heart_rate_average',
    heart_rate_variability_sdnn = 'heart_rate_variability_sdnn',
    heart_rate_variability_rmssd = 'heart_rate_variability_rmssd',
    blood_pressure_systolic = 'blood_pressure_systolic',
    blood_pressure_diastolic = 'blood_pressure_diastolic',
    blood_glucose = 'blood_glucose',
    vo2_max = 'vo2_max',
    oxygen_saturation = 'oxygen_saturation',
    respiratory_rate = 'respiratory_rate',
    active_energy_burned = 'active_energy_burned',
    basal_energy_burned = 'basal_energy_burned',
    total_energy_burned = 'total_energy_burned',
    basal_metabolic_rate = 'basal_metabolic_rate',
    time_in_daylight = 'time_in_daylight',
    body_temperature = 'body_temperature',
    basal_body_temperature = 'basal_body_temperature',
    sleeping_wrist_temperature = 'sleeping_wrist_temperature',
    height = 'height',
    weight = 'weight',
    lean_body_mass = 'lean_body_mass',
    body_mass_index = 'body_mass_index',
    body_fat = 'body_fat',
    body_water_mass = 'body_water_mass',
    bone_mass = 'bone_mass',
    waist_circumference = 'waist_circumference',
    stand_time = 'stand_time',
    move_time = 'move_time',
    exercise_time = 'exercise_time',
    activity_summary = 'activity_summary',
    device_lock = 'device_lock',
    exercise = 'exercise',
}
```

#### SahhaSensorStatus

```
export enum SahhaSensorStatus {
    pending = 0,
    unavailable = 1,
    disabled = 2,
    enabled = 3,
}
```

#### SahhaScoreType

```
export enum SahhaScoreType {
    wellbeing = 'wellbeing',
    activity = 'activity',
    sleep = 'sleep',
    readiness = 'readiness',
    mental_wellbeing = 'mental_wellbeing',
}
```

#### SahhaBiomarkerCategory

```
export enum SahhaBiomarkerCategory {
    activity = 'activity',
    body = 'body',
    characteristic = 'characteristic',
    reproductive = 'reproductive',
    sleep = 'sleep',
    vitals = 'vitals',
}
```

#### SahhaBiomarkerType

```
export enum SahhaBiomarkerType {
    steps = 'steps',
    floors_climbed = 'floors_climbed',
    active_hours = 'active_hours',
    active_duration = 'active_duration',
    activity_low_intensity_duration = 'activity_low_intensity_duration',
    activity_mid_intensity_duration = 'activity_mid_intensity_duration',
    activity_high_intensity_duration = 'activity_high_intensity_duration',
    activity_sedentary_duration = 'activity_sedentary_duration',
    active_energy_burned = 'active_energy_burned',
    total_energy_burned = 'total_energy_burned',
    height = 'height',
    weight = 'weight',
    body_mass_index = 'body_mass_index',
    body_fat = 'body_fat',
    fat_mass = 'fat_mass',
    lean_mass = 'lean_mass',
    waist_circumference = 'waist_circumference',
    resting_energy_burned = 'resting_energy_burned',
    age = 'age',
    biological_sex = 'biological_sex',
    date_of_birth = 'date_of_birth',
    menstrual_cycle_length = 'menstrual_cycle_length',
    menstrual_cycle_start_date = 'menstrual_cycle_start_date',
    menstrual_cycle_end_date = 'menstrual_cycle_end_date',
    menstrual_phase = 'menstrual_phase',
    menstrual_phase_start_date = 'menstrual_phase_start_date',
    menstrual_phase_end_date = 'menstrual_phase_end_date',
    menstrual_phase_length = 'menstrual_phase_length',
    sleep_start_time = 'sleep_start_time',
    sleep_end_time = 'sleep_end_time',
    sleep_duration = 'sleep_duration',
    sleep_debt = 'sleep_debt',
    sleep_interruptions = 'sleep_interruptions',
    sleep_in_bed_duration = 'sleep_in_bed_duration',
    sleep_awake_duration = 'sleep_awake_duration',
    sleep_light_duration = 'sleep_light_duration',
    sleep_rem_duration = 'sleep_rem_duration',
    sleep_deep_duration = 'sleep_deep_duration',
    sleep_regularity = 'sleep_regularity',
    sleep_latency = 'sleep_latency',
    sleep_efficiency = 'sleep_efficiency',
    heart_rate_resting = 'heart_rate_resting',
    heart_rate_sleep = 'heart_rate_sleep',
    heart_rate_variability_sdnn = 'heart_rate_variability_sdnn',
    heart_rate_variability_rmssd = 'heart_rate_variability_rmssd',
    respiratory_rate = 'respiratory_rate',
    respiratory_rate_sleep = 'respiratory_rate_sleep',
    oxygen_saturation = 'oxygen_saturation',
    oxygen_saturation_sleep = 'oxygen_saturation_sleep',
    vo2_max = 'vo2_max',
    blood_glucose = 'blood_glucose',
    blood_pressure_systolic = 'blood_pressure_systolic',
    blood_pressure_diastolic = 'blood_pressure_diastolic',
    body_temperature_basal = 'body_temperature_basal',
    skin_temperature_sleep = 'skin_temperature_sleep',
}
```

---

Copyright © 2022 - 2024 Sahha. All rights reserved.
