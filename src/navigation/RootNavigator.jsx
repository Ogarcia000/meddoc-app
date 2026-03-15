import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LockScreen from '../screens/auth/LockScreen';

import DashboardScreen from '../screens/DashboardScreen';
import PatientsListScreen from '../screens/PatientsListScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import EditPatientScreen from '../screens/EditPatientScreen';
import EditRecordScreen from '../screens/EditRecordScreen';
import SettingsScreen from '../screens/SettingsScreen';

const AuthStack = createNativeStackNavigator();
const LockStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PatientsStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bgCard },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
  headerBottomBorderColor: colors.border,
};

function PatientsStackNavigator() {
  return (
    <PatientsStack.Navigator screenOptions={stackScreenOptions}>
      <PatientsStack.Screen name="PatientsList" component={PatientsListScreen} options={{ title: 'Pacientes' }} />
      <PatientsStack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Detalle' }} />
      <PatientsStack.Screen name="EditPatient" component={EditPatientScreen} options={{ title: 'Paciente' }} />
      <PatientsStack.Screen name="EditRecord" component={EditRecordScreen} options={{ title: 'Registro' }} />
    </PatientsStack.Navigator>
  );
}

function DummyScreen() {
  return null;
}

function CenterTabButton({ onPress }) {
  return (
    <TouchableOpacity
      style={tabStyles.fabWrap}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Agregar nuevo paciente"
    >
      <View style={tabStyles.fab}>
        <Ionicons name="add" size={28} color={colors.textDark} />
      </View>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        tabBarStyle: tabStyles.bar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: tabStyles.label,
        tabBarIconStyle: { marginBottom: -2 },
        tabBarIcon: ({ color }) => {
          const icons = {
            Inicio: 'home-outline',
            Pacientes: 'people-outline',
            Ajustes: 'settings-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="medkit" size={20} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>MedDoc</Text>
            </View>
          ),
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Pacientes"
        component={PatientsStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('Pacientes', { screen: 'PatientsList' }),
        })}
      />
      <Tab.Screen
        name="Agregar"
        component={DummyScreen}
        options={{
          tabBarButton: (props) => (
            <CenterTabButton onPress={props.onPress} />
          ),
          tabBarLabel: () => null,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Pacientes', {
              screen: 'EditPatient',
              params: { mode: 'create' },
            });
          },
        })}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, locked } = useAuth();

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <Ionicons name="medkit" size={48} color={colors.accent} />
        <Text style={loadingStyles.logo}>MedDoc</Text>
        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : locked ? (
        <LockStack.Navigator screenOptions={{ headerShown: false }}>
          <LockStack.Screen name="Lock" component={LockScreen} />
        </LockStack.Navigator>
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.tabBorder,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 0,
  },
  fabWrap: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 8,
  },
});
