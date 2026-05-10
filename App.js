import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import DocumentsScreen from './screens/DocumentScreen';
import AdminScreen from './screens/AdminScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsAdmin(userDoc.data()?.role === 'admin');
      }
    };
    checkRole();
  }, []);

  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: '#aaa',
      tabBarStyle: { paddingBottom: 8, height: 60 },
    }}>
      <Tab.Screen name="HomeTab" component={HomeScreen}
        options={{ tabBarLabel: t('tabFichaje'), tabBarIcon: () => <Text style={{ fontSize: 20 }}>⏱️</Text> }} />
      <Tab.Screen name="ScheduleTab" component={ScheduleScreen}
        options={{ tabBarLabel: t('tabSchedule'), tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text> }} />
      <Tab.Screen name="DocumentsTab" component={DocumentsScreen}
        options={{ tabBarLabel: t('tabDocs'), tabBarIcon: () => <Text style={{ fontSize: 20 }}>📄</Text> }} />
      {isAdmin && (
        <Tab.Screen name="AdminTab" component={AdminScreen}
          options={{ tabBarLabel: t('tabAdmin'), tabBarIcon: () => <Text style={{ fontSize: 20 }}>👑</Text> }} />
      )}
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