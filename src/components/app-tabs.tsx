import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from './FloatingTabBar';

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
