'use client'

import { useState, useEffect, useCallback } from 'react'

export interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'unsupported',
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  // Check support and current status on mount
  useEffect(() => {
    checkSupport()
  }, [])

  const checkSupport = useCallback(async () => {
    // Check if browser supports push notifications
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState({
        isSupported: false,
        permission: 'unsupported',
        isSubscribed: false,
        isLoading: false,
        error: 'Push notifications are not supported in this browser',
      })
      return
    }

    // Check notification permission
    const permission = Notification.permission

    // Check if already subscribed
    let isSubscribed = false
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      isSubscribed = !!subscription
    } catch (error) {
      console.error('Error checking subscription:', error)
    }

    setState({
      isSupported: true,
      permission,
      isSubscribed,
      isLoading: false,
      error: null,
    })
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setState((prev) => ({ ...prev, permission }))
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting permission:', error)
      setState((prev) => ({
        ...prev,
        error: 'Failed to request notification permission',
      }))
      return false
    }
  }, [state.isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Notification permission denied',
          }))
          return false
        }
      }

      // Register service worker if not already
      const registration = await registerServiceWorker()
      if (!registration) {
        throw new Error('Failed to register service worker')
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        // Development mode - simulate subscription
        console.log('[Push] VAPID key not configured, simulating subscription')
        setState((prev) => ({
          ...prev,
          isSubscribed: true,
          isLoading: false,
        }))
        return true
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth')),
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error('Subscribe error:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }))
      return false
    }
  }, [state.isSupported, requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isSubscribed) {
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe()

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }))
      return false
    }
  }, [state.isSupported, state.isSubscribed])

  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      return false
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            title: 'Test Notification',
            body: 'Push notifications are working!',
            tag: 'test',
          },
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Test notification error:', error)
      return false
    }
  }, [state.isSubscribed])

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refresh: checkSupport,
  }
}

// Helper functions

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('[SW] Service worker registered:', registration.scope)
    return registration
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error)
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
