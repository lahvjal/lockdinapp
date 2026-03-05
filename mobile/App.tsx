import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { PaperProvider } from 'react-native-paper';
import AuthProvider from './src/components/auth/AuthProvider';

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <AuthProvider />
        <StatusBar style="auto" />
      </PaperProvider>
    </Provider>
  );
}
