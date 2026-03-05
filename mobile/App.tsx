import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <View style={styles.container}>
          <Text>LockdIn App - Setup Complete!</Text>
          <Text style={styles.subtitle}>Ready to start building</Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
  },
});
