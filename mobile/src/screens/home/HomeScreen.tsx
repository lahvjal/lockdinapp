import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { signOut } from '../../store/slices/authSlice';
import WorkoutHomeScreen from '../workout/WorkoutHomeScreen';
import MealsScreen from '../meals/MealsScreen';
import WaterScreen from '../water/WaterScreen';
import SleepScreen from '../sleep/SleepScreen';
import StreaksScreen from '../streaks/StreaksScreen';
import SkipTokensScreen from '../skip-tokens/SkipTokensScreen';
import PlanManagementScreen from '../plan/PlanManagementScreen';
import NotificationSettingsScreen from '../settings/NotificationSettingsScreen';

const Tab = createBottomTabNavigator();

function DashboardScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activePlans } = useSelector((state: RootState) => state.plan);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(signOut());
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Dashboard
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Hello, {user?.email}
      </Text>
      
      <View style={styles.plansInfo}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Active Plans:</Text>
        <Text>Workout: {activePlans.workout ? '✓' : '✗'}</Text>
        <Text>Meals: {activePlans.meal ? '✓' : '✗'}</Text>
        <Text>Water: {activePlans.water ? '✓' : '✗'}</Text>
        <Text>Sleep: {activePlans.sleep ? '✓' : '✗'}</Text>
      </View>

      <Button 
        mode="contained"
        onPress={() => navigation.navigate('Settings')}
        style={styles.button}
        icon="cog"
      >
        Settings
      </Button>

      <Button 
        mode="outlined" 
        onPress={handleSignOut}
        style={styles.button}
      >
        Sign Out
      </Button>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1976D2',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlanManagementScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Meals"
        component={MealsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Water"
        component={WaterScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="water" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sleep"
        component={SleepScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sleep" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Streaks"
        component={StreaksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="fire" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tokens"
        component={SkipTokensScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={NotificationSettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  plansInfo: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '100%',
  },
  comingSoon: {
    color: '#999',
    marginTop: 16,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
});
