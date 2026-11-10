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
      {/*
        Pantallas sin botón en la barra.
        NOTA (expo-router 58+): NO usar `href: null`. Ahora se traduce a `hidden: true`
        y el router redirige automáticamente a la pestaña inicial al intentar abrirlas.
        La visibilidad de botones la controla FloatingTabBar mediante `allowedRouteNames`.
      */}
      <Tabs.Screen name="profile" />
      <Tabs.Screen
        name="form-builder"
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="form-preview"
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
