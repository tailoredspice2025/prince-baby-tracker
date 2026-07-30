import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

/**
 * Last line of defence. Without this, any error thrown while rendering takes
 * the whole app down — which is exactly how the sleep-session hook-order bug
 * turned a display fault into a crash, and how DenBaby failed App Store
 * review. A boundary turns that into a screen you can recover from.
 *
 * Deliberately plain: no theme, no store, no fonts, no hooks. Whatever broke
 * upstream, this still has to render.
 */
type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surfaced in `npx react-native log-ios` / Xcode console and in the
    // TestFlight crash report if it does bring the app down anyway.
    console.error('[DenBaby] render error', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#FBF4EC', padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🍼</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#3A2E25', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 21, color: '#7C6E5F', marginBottom: 20 }}>
          Your logged entries are saved on this phone — nothing has been lost. Tap below to carry on.
        </Text>
        <Pressable
          onPress={this.reset}
          style={{ backgroundColor: '#E98862', borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Back to DenBaby</Text>
        </Pressable>

        <ScrollView style={{ maxHeight: 160, marginTop: 24 }}>
          <Text selectable style={{ fontSize: 11, color: '#B3A493' }}>
            {error.message}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
