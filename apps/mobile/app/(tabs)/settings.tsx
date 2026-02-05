import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  useColorScheme,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSettingsStore } from '@/stores/settings-store'

type SettingItemProps = {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  onPress?: () => void
  rightElement?: React.ReactNode
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
}: SettingItemProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <TouchableOpacity
      className={`flex-row items-center px-4 py-3 ${
        isDark ? 'active:bg-slate-800' : 'active:bg-gray-50'
      }`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress?.()
      }}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          isDark ? 'bg-slate-800' : 'bg-gray-100'
        }`}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isDark ? '#94a3b8' : '#6b7280'}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? '#475569' : '#d1d5db'}
          />
        )
      )}
    </TouchableOpacity>
  )
}

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <View className="mb-6">
      <Text
        className={`px-4 pb-2 text-sm font-medium uppercase ${
          isDark ? 'text-slate-500' : 'text-gray-500'
        }`}
      >
        {title}
      </Text>
      <View
        className={`rounded-2xl overflow-hidden mx-4 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {children}
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const {
    notificationsEnabled,
    setNotificationsEnabled,
    syncEnabled,
    setSyncEnabled,
  } = useSettingsStore()

  const bgColor = isDark ? 'bg-background-dark' : 'bg-surface'
  const textColor = isDark ? 'text-white' : 'text-gray-900'

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`} edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3">
        <Text className={`text-2xl font-bold ${textColor}`}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SettingSection title="General">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive reminders and alerts"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setNotificationsEnabled(value)
                }}
                trackColor={{ false: '#767577', true: '#2563eb' }}
              />
            }
          />
          <SettingItem
            icon="sync-outline"
            title="Auto Sync"
            subtitle="Sync notes across devices"
            rightElement={
              <Switch
                value={syncEnabled}
                onValueChange={(value) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSyncEnabled(value)
                }}
                trackColor={{ false: '#767577', true: '#2563eb' }}
              />
            }
          />
        </SettingSection>

        <SettingSection title="AI Provider">
          <SettingItem
            icon="hardware-chip-outline"
            title="AI Settings"
            subtitle="Configure your AI provider"
            onPress={() => {
              // TODO: Navigate to AI settings
            }}
          />
        </SettingSection>

        <SettingSection title="Data">
          <SettingItem
            icon="cloud-upload-outline"
            title="Backup & Restore"
            subtitle="Manage your data backups"
            onPress={() => {
              // TODO: Navigate to backup settings
            }}
          />
          <SettingItem
            icon="download-outline"
            title="Export Notes"
            subtitle="Export to Markdown or JSON"
            onPress={() => {
              // TODO: Export notes
            }}
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingItem
            icon="information-circle-outline"
            title="About CoBrain"
            subtitle="Version 1.0.0"
            onPress={() => {
              // TODO: Show about modal
            }}
          />
          <SettingItem
            icon="logo-github"
            title="Source Code"
            subtitle="View on GitHub"
            onPress={() => {
              Linking.openURL('https://github.com/cobrain-ai/cobrain')
            }}
          />
          <SettingItem
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={() => {
              Linking.openURL('https://cobrain.ai/privacy')
            }}
          />
        </SettingSection>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
