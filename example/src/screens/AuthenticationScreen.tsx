import { useCallback, useEffect, useState } from 'react';
import type * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Sahha from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { InlineHint } from '../components/InlineHint';
import { ResponseSheet } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { SAHHA_SETTINGS } from '../data/settings';
import { StorageKeys, loadString, saveString } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type SdkModule = NonNullable<typeof Sahha>;

interface SheetState {
  visible: boolean;
  title: string;
  subtitle: string;
  body: string;
  isError: boolean;
}

const CLOSED_SHEET: SheetState = {
  visible: false,
  title: '',
  subtitle: '',
  body: '',
  isError: false,
};

/**
 * Exercises the authentication surface of the SDK: `authenticate`,
 * `authenticateToken`, `deauthenticate`, `isAuthenticated`, `getProfileToken`
 * and `configure`.
 */
export function AuthenticationScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [externalId, setExternalId] = useState('');
  const [profileToken, setProfileToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const [authenticating, setAuthenticating] = useState(false);
  const [tokenAuthenticating, setTokenAuthenticating] = useState(false);
  const [deauthenticating, setDeauthenticating] = useState(false);
  const [fetchingToken, setFetchingToken] = useState(false);
  const [configuring, setConfiguring] = useState(false);

  const [hint, setHint] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  // Restore any previously saved credentials on launch, falling back to the
  // keys written by the old single-file example app.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const [storedAppId, storedAppSecret, storedExternalId] =
        await Promise.all([
          loadString(StorageKeys.appId),
          loadString(StorageKeys.appSecret),
          loadString(StorageKeys.externalId),
        ]);
      if (cancelled) {
        return;
      }
      if (storedAppId !== null) {
        setAppId(storedAppId);
      }
      if (storedAppSecret !== null) {
        setAppSecret(storedAppSecret);
      }
      if (storedExternalId !== null) {
        setExternalId(storedExternalId);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const showSheet = (
    title: string,
    subtitle: string,
    body: string,
    isError: boolean
  ) => {
    setSheet({ visible: true, title, subtitle, body, isError });
  };

  const withSdk = (
    subtitle: string,
    run: (sdk: SdkModule) => void,
    onUnavailable: () => void
  ) => {
    const sdk = Sahha;
    if (!sdk) {
      onUnavailable();
      showSheet(
        'Unavailable',
        subtitle,
        'The Sahha native module is not linked in this build.',
        true
      );
      return;
    }
    run(sdk);
  };

  const refreshStatus = useCallback(() => {
    const sdk = Sahha;
    if (!sdk) {
      setStatusLoading(false);
      setIsAuthenticated(null);
      return;
    }
    setStatusLoading(true);
    sdk.isAuthenticated((error: string, success: boolean) => {
      setStatusLoading(false);
      if (error) {
        console.log(`Is Authenticated Error: ${error}`);
        setIsAuthenticated(null);
      } else {
        console.log(`Is Authenticated Result: ${success}`);
        setIsAuthenticated(success);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  const editField =
    (key: string, setter: (value: string) => void) => (value: string) => {
      setter(value);
      setHint(null);
      saveString(key, value);
    };

  const onAuthenticate = () => {
    if (!appId.trim() || !appSecret.trim() || !externalId.trim()) {
      setHint('App ID, App Secret and External ID are all required.');
      return;
    }
    setHint(null);
    setAuthenticating(true);
    withSdk(
      'Sahha.authenticate',
      (sdk) => {
        sdk.authenticate(
          appId.trim(),
          appSecret.trim(),
          externalId.trim(),
          (error: string, success: boolean) => {
            setAuthenticating(false);
            console.log(`Authenticate Result: ${error || success}`);
            showSheet(
              error ? 'Authentication failed' : 'Authenticated',
              'Sahha.authenticate',
              error || String(success),
              Boolean(error)
            );
            refreshStatus();
          }
        );
      },
      () => setAuthenticating(false)
    );
  };

  const onAuthenticateToken = () => {
    if (!profileToken.trim() || !refreshToken.trim()) {
      setHint('Both a profile token and a refresh token are required.');
      return;
    }
    setHint(null);
    setTokenAuthenticating(true);
    withSdk(
      'Sahha.authenticateToken',
      (sdk) => {
        sdk.authenticateToken(
          profileToken.trim(),
          refreshToken.trim(),
          (error: string, success: boolean) => {
            setTokenAuthenticating(false);
            console.log(`Authenticate Token Result: ${error || success}`);
            showSheet(
              error ? 'Token authentication failed' : 'Authenticated',
              'Sahha.authenticateToken',
              error || String(success),
              Boolean(error)
            );
            refreshStatus();
          }
        );
      },
      () => setTokenAuthenticating(false)
    );
  };

  const onGetProfileToken = () => {
    setFetchingToken(true);
    withSdk(
      'Sahha.getProfileToken',
      (sdk) => {
        sdk.getProfileToken((error: string, token?: string) => {
          setFetchingToken(false);
          showSheet(
            error ? 'Get profile token failed' : 'Profile token',
            'Sahha.getProfileToken',
            error || token || 'None',
            Boolean(error)
          );
        });
      },
      () => setFetchingToken(false)
    );
  };

  const onDeauthenticate = () => {
    setDeauthenticating(true);
    withSdk(
      'Sahha.deauthenticate',
      (sdk) => {
        sdk.deauthenticate((error: string, success: boolean) => {
          setDeauthenticating(false);
          console.log(`Deauthenticate Result: ${error || success}`);
          if (!error) {
            setExternalId('');
            saveString(StorageKeys.externalId, '');
          }
          showSheet(
            error ? 'Deauthentication failed' : 'Deauthenticated',
            'Sahha.deauthenticate',
            error || String(success),
            Boolean(error)
          );
          refreshStatus();
        });
      },
      () => setDeauthenticating(false)
    );
  };

  const onConfigure = () => {
    setConfiguring(true);
    withSdk(
      'Sahha.configure',
      (sdk) => {
        sdk.configure(SAHHA_SETTINGS, (error: string, success: boolean) => {
          setConfiguring(false);
          showSheet(
            error ? 'Configure failed' : 'Configured',
            'Sahha.configure',
            error || String(success),
            Boolean(error)
          );
        });
      },
      () => setConfiguring(false)
    );
  };

  const busy =
    authenticating ||
    tokenAuthenticating ||
    deauthenticating ||
    fetchingToken ||
    configuring;

  const statusColor = statusLoading
    ? theme.colors.onSurfaceVariant
    : isAuthenticated === true
      ? theme.colors.success
      : isAuthenticated === false
        ? theme.colors.warning
        : theme.colors.onSurfaceVariant;

  const statusLabel = statusLoading
    ? 'Checking…'
    : isAuthenticated === true
      ? 'Authenticated'
      : isAuthenticated === false
        ? 'Not authenticated'
        : 'Unknown';

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <View style={styles.statusRow}>
            <Text
              style={[styles.statusTitle, { color: theme.colors.onSurface }]}
            >
              Status
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh status"
              hitSlop={10}
              disabled={statusLoading}
              onPress={refreshStatus}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text
                style={[styles.refreshGlyph, { color: theme.colors.primary }]}
              >
                ↻
              </Text>
            </Pressable>
          </View>
          <Text
            style={[
              styles.statusValue,
              { marginTop: theme.spacing.sm, color: statusColor },
            ]}
          >
            {statusLabel}
          </Text>
        </Card>

        <SectionHeader
          title="APP CREDENTIALS"
          style={{ marginTop: theme.spacing.xl }}
        />
        <Card>
          <LabeledInput
            theme={theme}
            label="APP ID"
            value={appId}
            onChangeText={editField(StorageKeys.appId, setAppId)}
          />
          <LabeledInput
            theme={theme}
            label="APP SECRET"
            value={appSecret}
            secureTextEntry={!showSecret}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  showSecret ? 'Hide app secret' : 'Show app secret'
                }
                hitSlop={8}
                onPress={() => setShowSecret((previous) => !previous)}
              >
                <Text
                  style={[styles.toggleLabel, { color: theme.colors.primary }]}
                >
                  {showSecret ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            }
            onChangeText={editField(StorageKeys.appSecret, setAppSecret)}
          />
          <LabeledInput
            theme={theme}
            label="EXTERNAL ID"
            value={externalId}
            onChangeText={editField(StorageKeys.externalId, setExternalId)}
          />
        </Card>

        {hint ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <InlineHint message={hint} />
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <AppButton
            title="AUTHENTICATE"
            loading={authenticating}
            disabled={busy && !authenticating}
            onPress={onAuthenticate}
          />
          <AppButton
            title="GET PROFILE TOKEN"
            variant="outline"
            loading={fetchingToken}
            disabled={busy && !fetchingToken}
            onPress={onGetProfileToken}
          />
          <AppButton
            title="CONFIGURE"
            variant="secondary"
            loading={configuring}
            disabled={busy && !configuring}
            onPress={onConfigure}
          />
          <AppButton
            title="DEAUTHENTICATE"
            variant="danger"
            loading={deauthenticating}
            disabled={busy && !deauthenticating}
            onPress={onDeauthenticate}
          />
        </View>

        <SectionHeader
          title="AUTHENTICATE WITH TOKENS"
          style={{ marginTop: theme.spacing.xl }}
        />
        <Card>
          <LabeledInput
            theme={theme}
            label="PROFILE TOKEN"
            value={profileToken}
            multiline
            onChangeText={(value) => {
              setProfileToken(value);
              setHint(null);
            }}
          />
          <LabeledInput
            theme={theme}
            label="REFRESH TOKEN"
            value={refreshToken}
            multiline
            onChangeText={(value) => {
              setRefreshToken(value);
              setHint(null);
            }}
          />
          <AppButton
            title="AUTHENTICATE WITH TOKENS"
            variant="secondary"
            loading={tokenAuthenticating}
            disabled={busy && !tokenAuthenticating}
            onPress={onAuthenticateToken}
            style={{ marginTop: theme.spacing.xs }}
          />
        </Card>
      </ScrollView>

      <ResponseSheet
        visible={sheet.visible}
        title={sheet.title}
        subtitle={sheet.subtitle}
        body={sheet.body}
        isError={sheet.isError}
        onClose={() => setSheet(CLOSED_SHEET)}
      />
    </>
  );
}

function LabeledInput({
  theme,
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  multiline = false,
  trailing,
}: {
  theme: AppTheme;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <View style={[styles.fieldHeader, { marginBottom: theme.spacing.xs }]}>
        <Text
          style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>
        {trailing}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : styles.inputSingleLine,
          {
            borderColor: theme.colors.outlineVariant,
            borderRadius: theme.radius.control,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md - 2,
            color: theme.colors.onSurface,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshGlyph: {
    fontSize: 18,
  },
  toggleLabel: {
    fontSize: 13,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
  },
  inputSingleLine: {
    textAlignVertical: 'center',
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
