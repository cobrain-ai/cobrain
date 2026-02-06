import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import * as Notifications from 'expo-notifications'
import { SchedulableTriggerInputTypes } from 'expo-notifications'
import { Platform } from 'react-native'

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

interface NotificationContextValue {
  expoPushToken: string | null
  hasPermission: boolean
  scheduleReminder: (title: string, body: string, triggerDate: Date) => Promise<string>
  cancelNotification: (id: string) => Promise<void>
  cancelAllNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  expoPushToken: null,
  hasPermission: false,
  scheduleReminder: async () => '',
  cancelNotification: async () => {},
  cancelAllNotifications: async () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    async function registerForPushNotifications() {
      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      setHasPermission(finalStatus === 'granted')

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted')
        return
      }

      // Get Expo push token
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-project-id', // Replace with actual project ID
        })
        setExpoPushToken(tokenData.data)
      } catch (error) {
        console.error('Failed to get push token:', error)
      }

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        })
      }
    }

    registerForPushNotifications()

    // Handle notification responses (when user taps notification)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data
        console.log('Notification tapped:', data)
        // TODO: Handle deep linking based on notification data
      })

    return () => {
      responseSubscription.remove()
    }
  }, [])

  const scheduleReminder = async (
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<string> => {
    const trigger: Notifications.NotificationTriggerInput =
      triggerDate.getTime() - Date.now() > 0
        ? { type: SchedulableTriggerInputTypes.DATE, date: triggerDate }
        : { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 } // Immediate if date is in the past

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'reminder' },
      },
      trigger,
    })

    return id
  }

  const cancelNotification = async (id: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(id)
  }

  const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        hasPermission,
        scheduleReminder,
        cancelNotification,
        cancelAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
