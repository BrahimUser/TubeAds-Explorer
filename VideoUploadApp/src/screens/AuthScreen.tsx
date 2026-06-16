import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const LOGO = require('../../assets/images/logo.png');
import type { StackScreenProps } from '@react-navigation/stack';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../navigation/types';
import {
  mapFirebaseAuthError,
  registerWithPhonePassword,
  signInWithPhonePassword,
} from '../services/phonePasswordAuth';
import { colors, radii, spacing, typography } from '../theme';

type Props = StackScreenProps<RootStackParamList, 'Auth'>;

type Mode = 'sign-in' | 'sign-up';

/**
 * Phone + password auth — same synthetic email + Firestore user doc flow as the website.
 */
export function AuthScreen({ navigation, route }: Props) {
  const [mode, setMode] = useState<Mode>(route.params?.mode ?? 'sign-in');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

  const errors = useMemo(() => {
    const e: { phone?: string; password?: string } = {};
    const digits = phoneLocal.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 9) e.phone = 'Enter a valid MA number';
    if (password.length > 0 && password.length < 6) e.password = 'At least 6 characters';
    return e;
  }, [phoneLocal, password]);

  const digitsOk = phoneLocal.replace(/\D/g, '').length >= 9;
  const canSubmit =
    digitsOk && password.length >= 6 && Object.keys(errors).length === 0 && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      if (isSignUp) {
        await registerWithPhonePassword(phoneLocal, password);
      } else {
        await signInWithPhonePassword(phoneLocal, password);
      }
      navigation.goBack();
    } catch (e) {
      const code = (e as { code?: string })?.code;
      const msg =
        typeof code === 'string' && code.startsWith('auth/')
          ? mapFirebaseAuthError(e)
          : String((e as Error)?.message ?? e);
      Alert.alert(isSignUp ? 'Sign-up failed' : 'Sign-in failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <View style={styles.header}>
          <Text style={styles.headline}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={styles.subhead}>
            {isSignUp
              ? 'Use your Morocco mobile number and a password (same as the website).'
              : 'Sign in with your phone number and password.'}
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, !isSignUp && styles.tabActive]}
            onPress={() => setMode('sign-in')}
          >
            <Text style={[styles.tabLabel, !isSignUp && styles.tabLabelActive]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, isSignUp && styles.tabActive]}
            onPress={() => setMode('sign-up')}
          >
            <Text style={[styles.tabLabel, isSignUp && styles.tabLabelActive]}>
              Create account
            </Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <Field
            label="Mobile (Morocco)"
            value={phoneLocal}
            onChangeText={setPhoneLocal}
            placeholder="06 XX XX XX XX"
            error={phoneLocal.length > 0 ? errors.phone : undefined}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            error={password.length > 0 ? errors.password : undefined}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
          />
        </View>

        <Button
          label={isSignUp ? 'Create account' : 'Sign in'}
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={!canSubmit}
          onPress={onSubmit}
        />

        <Text style={styles.footer}>
          By continuing you agree to allow us to upload your videos to your YouTube channel when
          you publish an ad.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  textContentType?: React.ComponentProps<typeof TextInput>['textContentType'];
}) {
  const { label, error, ...rest } = props;
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        {...rest}
        style={[fieldStyles.input, !!error && fieldStyles.inputError]}
        placeholderTextColor={colors.textDim}
      />
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginTop: spacing.lg,
  },
  header: { gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  headline: { ...typography.display, color: colors.text, textAlign: 'center' },
  subhead: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radii.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
    borderBottomColor: colors.secondary,
  },
  tabLabel: { ...typography.title, color: colors.tabMuted, fontSize: 13 },
  tabLabelActive: { color: colors.text },
  fields: { gap: spacing.md },
  footer: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default AuthScreen;
