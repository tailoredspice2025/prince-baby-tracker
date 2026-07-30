import React from 'react';
import { NightThemeProvider, useNightFeedingView } from '../../theme/ThemeProvider';
import { DayHomeView } from './DayHomeView';
import { NightHomeView } from './NightHomeView';

/**
 * Nothing but a switch. Each view owns its own hooks, so flipping between
 * them can never change the hook count of a single component mid-render —
 * which is what crashed the app when a sleep session started after 8pm.
 */
export function HomeScreen() {
  const nightFeedingView = useNightFeedingView();
  if (!nightFeedingView) return <DayHomeView />;
  return (
    <NightThemeProvider>
      <NightHomeView />
    </NightThemeProvider>
  );
}
