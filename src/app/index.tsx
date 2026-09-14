import { Redirect } from 'expo-router';

export default function Index() {
  // @ts-ignore - Expo router types might complain but this is the valid runtime path
  return <Redirect href="/(auth)" />;
}
