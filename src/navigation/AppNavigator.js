import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
import SettingsScreen from '../screens/main/SettingsScreen';

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

// Custom Tab Bar — Modern Floating Dock matching reference design
function CustomTabBar({ state, descriptors, navigation }) {
  const tabs = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
    { name: 'Map', icon: 'compass-outline', activeIcon: 'compass', label: 'Explore' },
    { isCenter: true },
    { name: 'Chats', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', label: 'Messages' },
    { name: 'Profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
  ];

  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.dock}>
        {tabs.map((tab) => {
          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key="center-fab"
                style={tabStyles.centerBtn}
                onPress={() => navigation.navigate('CreateReport')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            );
          }

          const routeIndex = state.routes.findIndex(r => r.name === tab.name);
          const isFocused = state.index === routeIndex;

          return (
            <TouchableOpacity
              key={tab.name}
              style={tabStyles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? tab.activeIcon : tab.icon}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  tabStyles.tabLabel,
                  { color: isFocused ? COLORS.primary : COLORS.textMuted },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
        <LinearGradient colors={[COLORS.background, COLORS.headerBackground]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>J</Text>
        </View>
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
            <Stack.Screen name="CreateReport" component={CreateReportScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'card' }} />
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
  loadingLogo: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border },
  loadingLogoText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 36, color: COLORS.primary },
});

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
});
