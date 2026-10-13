import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import ChatsListScreen from '../screens/main/ChatsListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CreateReportScreen from '../screens/main/CreateReportScreen';
import ReportDetailScreen from '../screens/main/ReportDetailScreen';
import ChatScreen from '../screens/main/ChatScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

// Settings Screens
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PrivacySecurityScreen from '../screens/settings/PrivacySecurityScreen';
import HelpFaqScreen from '../screens/settings/HelpFaqScreen';
import AboutScreen from '../screens/settings/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={HomeScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
    </Stack.Navigator>
  );
}

// Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }) {
  const tabs = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Beranda' },
    { name: 'Map', icon: 'map-outline', activeIcon: 'map', label: 'Peta' },
    { name: 'Chats', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', label: 'Pesan' },
    { name: 'Notifications', icon: 'notifications-outline', activeIcon: 'notifications', label: 'Notifikasi' },
    { name: 'Profile', icon: 'person-outline', activeIcon: 'person', label: 'Profil' },
  ];

  return (
    <View style={tabStyles.container}>
      <LinearGradient
        colors={[COLORS.surface, '#0D1117CC']}
        style={tabStyles.gradient}
      >
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={tabStyles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              {isFocused && (
                <LinearGradient
                  colors={[COLORS.primary + '30', COLORS.accent + '20']}
                  style={tabStyles.activeIndicator}
                />
              )}
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={24}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
              {/* Show label only when active */}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Chats" component={ChatsListScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <LinearGradient colors={[COLORS.background, '#0D1F35']} style={StyleSheet.absoluteFillObject} />
        <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.loadingLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="search" size={36} color="white" />
        </LinearGradient>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: 'card' }} />
            {/* Settings Screens */}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="HelpFaq" component={HelpFaqScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'card' }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingLogo: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});

const tabStyles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  gradient: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0, left: 8, right: 8, bottom: 0,
    borderRadius: 12,
  },
});
