import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (routeName: string, params?: object) => void)(name, params);
  }
}
