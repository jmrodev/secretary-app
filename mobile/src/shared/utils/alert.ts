import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert utility.
 * React Native Web stubs out Alert.alert as a no-op; this helper ensures
 * notifications and validation errors are actually visible on both web and native.
 */
export const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const fullMessage = message ? `${title}\n\n${message}` : title;
        window.alert(fullMessage);
    } else {
        Alert.alert(title, message);
    }
};
