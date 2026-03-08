import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store/store';
import { RootState } from './src/store/store';
import { PaperProvider } from 'react-native-paper';
import AuthProvider from './src/components/auth/AuthProvider';
import WorkoutSessionScreen from './src/screens/workout/WorkoutSessionScreen';

function AppContent() {
  const sessionStatus = useSelector((s: RootState) => s.workoutSession.status);
  return (
    <>
      <AuthProvider />
      {sessionStatus !== 'idle' && <WorkoutSessionScreen />}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PaperProvider>
          <AppContent />
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
