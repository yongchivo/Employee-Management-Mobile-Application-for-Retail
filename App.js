import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { auth } from './firebase';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: '#aaa',
      tabBarStyle: { paddingBottom: 8, height: 60 },
    }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabFichaje'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⏱️</Text>,
        }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleScreen}
        options={{
          tabBarLabel: t('tabSchedule'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  if (user === undefined) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user
            ? <Stack.Screen name="Main" component={MainTabs} />
            : <Stack.Screen name="Login" component={LoginScreen} />
          }
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}