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
          title: 'Agenda',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Gridflow',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
        }}
      />
    </Tabs>
  );
}
