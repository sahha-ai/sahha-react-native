import { SahhaEnvironment } from 'sahha-react-native';

/**
 * The settings object passed to `Sahha.configure`. Shared by the launch-time
 * call in `App.tsx` and the manual "Configure" action on the Authentication
 * screen so both always exercise the same configuration.
 */
export const SAHHA_SETTINGS = {
  environment: SahhaEnvironment.sandbox,
  notificationSettings: {
    icon: 'notification',
    title: 'Test Title',
    shortDescription: 'Test description.',
  },
};
