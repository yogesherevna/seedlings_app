import { Alert } from 'react-native';

export type HarvestShortageMode = 'one-time' | 'subscription';

/** Native equivalent of the Website's harvest-shortage confirmation dialog. */
export function confirmHarvestShortage(args: {
  mode: HarvestShortageMode;
  availableGrams: number;
  requestedGrams: number;
  shortageGrams: number;
}): Promise<'continue' | 'contact'> {
  const available = Math.max(0, Math.floor(args.availableGrams));
  const requested = Math.max(0, Math.floor(args.requestedGrams));
  const shortage = Math.max(0, Math.floor(args.shortageGrams));
  const message = args.mode === 'subscription'
    ? `Only ${available} gms will be available for this delivery out of ${requested} gms requested. The remaining ${shortage} gms will be covered with your upcoming delivery.\n\nWould you like to continue with your order?`
    : `Only ${available} gms will be available for this delivery out of ${requested} gms requested.\n\nWould you like to continue with your order?`;

  return new Promise((resolve) => {
    Alert.alert(
      'Limited harvest available',
      message,
      [
        { text: 'No, contact me', style: 'cancel', onPress: () => resolve('contact') },
        { text: 'Yes, continue', onPress: () => resolve('continue') },
      ],
      { cancelable: false },
    );
  });
}
