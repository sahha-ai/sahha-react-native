import { useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sahha from 'sahha-react-native';
import type { RootStackParamList } from '../App';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type TileTint = 'primary' | 'secondary' | 'tertiary';

/** Header refresh control, built outside the screen so it stays stable. */
function headerRefreshButton(onPress: () => void, color: string) {
  return () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Refresh status"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={[styles.headerGlyph, { color }]}>↻</Text>
    </Pressable>
  );
}

/**
 * Dashboard for the test harness: an authentication status banner plus the
 * screens that exercise each area of the SDK, grouped by concern.
 */
export function HomeScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const navigation = useNavigation<HomeNavigation>();

  // Null while the first check is in flight, or after a failed check.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshAuthStatus = useCallback(() => {
    const sdk = Sahha;
    if (!sdk) {
      setIsAuthenticated(null);
      setAuthError('Sahha native module unavailable');
      return;
    }
    sdk.isAuthenticated((error: string, success: boolean) => {
      if (error) {
        console.log(`isAuthenticated error: ${error}`);
        setIsAuthenticated(null);
        setAuthError(error);
      } else {
        console.log(`isAuthenticated: ${success}`);
        setIsAuthenticated(success);
        setAuthError(null);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshAuthStatus();
    }, [refreshAuthStatus])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: headerRefreshButton(refreshAuthStatus, theme.colors.primary),
    });
  }, [navigation, refreshAuthStatus, theme.colors.primary]);

  useEffect(
    () => () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    },
    []
  );

  const postSensorData = () => {
    console.log('Post Sensor Data requested');
    Sahha?.postSensorData();
    setNotice('Sensor data post requested');
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }
    noticeTimer.current = setTimeout(() => setNotice(null), 2500);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl * 2,
      }}
    >
      <AuthBanner
        theme={theme}
        isAuthenticated={isAuthenticated}
        error={authError}
        onPress={() => navigation.navigate('Authentication')}
      />

      <SectionHeader title="SETUP" style={{ marginTop: theme.spacing.xl }} />
      <Card style={styles.tileCard}>
        <NavTile
          theme={theme}
          tint="primary"
          glyph="🔐"
          title="Authentication"
          subtitle="Authenticate, deauthenticate, profile tokens"
          onPress={() => navigation.navigate('Authentication')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="primary"
          glyph="👤"
          title="Profile"
          subtitle="Post and fetch demographic details"
          onPress={() => navigation.navigate('Profile')}
        />
      </Card>

      <SectionHeader title="SENSORS" style={{ marginTop: theme.spacing.xl }} />
      <Card style={styles.tileCard}>
        <NavTile
          theme={theme}
          tint="secondary"
          glyph="📡"
          title="Sensor Permissions"
          subtitle="Enable or check status for a chosen sensor set"
          onPress={() => navigation.navigate('SensorPermissions')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="secondary"
          glyph="🩺"
          title="Sensor Diagnostics"
          subtitle="Per-sensor status across the whole sensor list"
          onPress={() => navigation.navigate('SensorDiagnostics')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="secondary"
          glyph="☁️"
          title="Post Sensor Data"
          subtitle={notice ?? 'Trigger an immediate upload — iOS only'}
          subtitleHighlighted={notice !== null}
          trailingGlyph="↑"
          onPress={postSensorData}
        />
      </Card>

      <SectionHeader title="DATA" style={{ marginTop: theme.spacing.xl }} />
      <Card style={styles.tileCard}>
        <NavTile
          theme={theme}
          tint="tertiary"
          glyph="📊"
          title="Scores"
          subtitle="getScores over score types and a date range"
          onPress={() => navigation.navigate('Scores')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="tertiary"
          glyph="🧬"
          title="Biomarkers"
          subtitle="getBiomarkers by category, type and date range"
          onPress={() => navigation.navigate('Biomarkers')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="tertiary"
          glyph="📈"
          title="Stats"
          subtitle="getStats aggregates for a single sensor"
          isDeprecated
          onPress={() => navigation.navigate('Stats')}
        />
        <Divider theme={theme} />
        <NavTile
          theme={theme}
          tint="tertiary"
          glyph="⏱"
          title="Samples"
          subtitle="getSamples raw readings for a single sensor"
          isDeprecated
          onPress={() => navigation.navigate('Samples')}
        />
      </Card>
    </ScrollView>
  );
}

function AuthBanner({
  theme,
  isAuthenticated,
  error,
  onPress,
}: {
  theme: AppTheme;
  isAuthenticated: boolean | null;
  error: string | null;
  onPress: () => void;
}): React.JSX.Element {
  let background = theme.colors.surfaceVariant;
  let foreground = theme.colors.onSurfaceVariant;
  let title = 'Checking…';
  let subtitle = 'Reading isAuthenticated from the SDK';

  if (error !== null) {
    background = theme.colors.errorContainer;
    foreground = theme.colors.onErrorContainer;
    title = '⚠ Status unavailable';
    subtitle = error;
  } else if (isAuthenticated === true) {
    background = theme.colors.successContainer;
    foreground = theme.colors.onSuccessContainer;
    title = '✓ Authenticated';
    subtitle = 'A profile is signed in on this device';
  } else if (isAuthenticated === false) {
    background = theme.colors.warningContainer;
    foreground = theme.colors.onWarningContainer;
    title = '! Not authenticated — tap to authenticate';
    subtitle = 'Authenticate before fetching any data';
  }

  return (
    <Card
      onPress={onPress}
      style={{ backgroundColor: background, borderColor: background }}
    >
      <View style={styles.bannerRow}>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: foreground }]}>
            {title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.bannerSubtitle, { color: foreground }]}
          >
            {subtitle}
          </Text>
        </View>
        <Text style={[styles.bannerChevron, { color: foreground }]}>›</Text>
      </View>
    </Card>
  );
}

function Divider({ theme }: { theme: AppTheme }): React.JSX.Element {
  return (
    <View
      style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]}
    />
  );
}

function NavTile({
  theme,
  tint,
  glyph,
  title,
  subtitle,
  onPress,
  isDeprecated = false,
  subtitleHighlighted = false,
  trailingGlyph = '›',
}: {
  theme: AppTheme;
  tint: TileTint;
  glyph: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  isDeprecated?: boolean;
  subtitleHighlighted?: boolean;
  trailingGlyph?: string;
}): React.JSX.Element {
  const tints: Record<TileTint, string> = {
    primary: theme.colors.primaryContainer,
    secondary: theme.colors.secondaryContainer,
    tertiary: theme.colors.tertiaryContainer,
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
      })}
    >
      <View
        style={[
          styles.tileIcon,
          {
            borderRadius: theme.radius.control,
            backgroundColor: tints[tint],
            marginRight: theme.spacing.md,
          },
        ]}
      >
        <Text style={styles.tileGlyph}>{glyph}</Text>
      </View>
      <View style={styles.tileBody}>
        <View style={styles.tileTitleRow}>
          <Text
            numberOfLines={1}
            style={[styles.tileTitle, { color: theme.colors.onSurface }]}
          >
            {title}
          </Text>
          {isDeprecated ? (
            <View
              style={[
                styles.badge,
                {
                  marginLeft: theme.spacing.sm,
                  backgroundColor: theme.colors.warningContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeLabel,
                  { color: theme.colors.onWarningContainer },
                ]}
              >
                deprecated
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.tileSubtitle,
            {
              color: subtitleHighlighted
                ? theme.colors.success
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Text
        style={[
          styles.tileChevron,
          {
            color: theme.colors.onSurfaceVariant,
            marginLeft: theme.spacing.sm,
          },
        ]}
      >
        {trailingGlyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerGlyph: {
    fontSize: 20,
  },
  tileCard: {
    padding: 0,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  bannerChevron: {
    fontSize: 22,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  tileIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: {
    fontSize: 18,
  },
  tileBody: {
    flex: 1,
  },
  tileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  tileSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tileChevron: {
    fontSize: 20,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
