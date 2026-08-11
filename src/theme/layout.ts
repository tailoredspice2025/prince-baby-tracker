import { useWindowDimensions } from 'react-native';

/** iPad portrait is 768pt at its narrowest, so anything at or above this is a
 * tablet in either orientation. */
export const TABLET_BREAKPOINT = 768;

/** Roughly a large phone's width. The point is not to fill the iPad — it is to
 * stop a two-column grid of quick-log tiles becoming two 480pt slabs, and to
 * keep a line of text short enough to read in one eye movement. */
export const CONTENT_MAX_WIDTH = 700;

/**
 * `ios.supportsTablet` has been on since the first build, so the App Store
 * lists DenBaby as an iPad app and requires iPad screenshots — but no screen
 * had a width cap, so the phone layout simply stretched. Every `ScrollView`
 * passes this through `contentContainerStyle` to get a centred column.
 */
export function useContentStyle() {
  const { width } = useWindowDimensions();
  if (width < TABLET_BREAKPOINT) return null;
  return { maxWidth: CONTENT_MAX_WIDTH, width: '100%' as const, alignSelf: 'center' as const };
}
