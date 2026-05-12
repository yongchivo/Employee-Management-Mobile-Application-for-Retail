import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { auth, db } from './firebase';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import DocumentsScreen from './screens/DocumentScreen';
import AdminScreen from './screens/AdminScreen';
import EditScheduleScreen from './screens/EditScheduleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ isAdmin }) {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      key={isAdmin ? 'admin-tabs' : 'user-tabs'}
      screenOptions={{
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
  const [isAdmin, setIsAdmin] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
    console.log('🔐 Auth changed:', u?.email);
    if (u) {
      try {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        const data = userDoc.data();
        console.log('📄 User doc:', data);
        console.log('👑 Role:', data?.role, '→ isAdmin:', data?.role === 'admin');
        setIsAdmin(data?.role === 'admin');
      } catch (e) {
        console.error('❌ Error:', e);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    setUser(u);
  });
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
          {user ? (
            <>
              <Stack.Screen name="Main">
                {() => <MainTabs isAdmin={isAdmin} />}
              </Stack.Screen>
              <Stack.Screen name="EditSchedule" component={EditScheduleScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}