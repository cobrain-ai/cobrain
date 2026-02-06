import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function AISettingsLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        },
      }}
    />
  )
}
