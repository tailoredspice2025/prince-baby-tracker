import * as LocalAuthentication from 'expo-local-authentication';

/** Whether this device can actually do biometric/passcode auth at all. */
export async function canUseAppLock(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  // Face ID / Touch ID enrolled, OR device has a passcode set — either
  // lets authenticateAsync succeed, so either is sufficient to offer the toggle.
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (enrolled) return true;
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return types.length > 0;
}

export async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock DenBaby',
    disableDeviceFallback: false,
    cancelLabel: 'Cancel',
  });
  return result.success;
}
