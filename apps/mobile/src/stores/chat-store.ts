import { create } from 'zustand'
import { LocalLLMProvider } from '@cobrain/core/src/providers/local-llm'
import { getLocalLLMBridge } from '@/providers/local-llm-bridge'
import { useSettingsStore } from './settings-store'
import { useLocalLLMStore } from './local-llm-store'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const { aiProvider } = useSettingsStore.getState()
      let responseContent: string

      if (aiProvider === 'local-llm') {
        responseContent = await getLocalLLMResponse(content)
      } else {
        // Fallback to simulated responses for other providers
        // TODO: Integrate Ollama, OpenAI, Anthropic providers
        await new Promise((resolve) => setTimeout(resolve, 1000))
        responseContent = getSimulatedResponse(content)
      }

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to get AI response:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to get response',
        isLoading: false,
      })
    }
  },

  clearChat: () => {
    set({ messages: [], error: null })
  },
}))

let cachedProvider: LocalLLMProvider | null = null
let cachedModelId: string | null = null

async function getLocalLLMResponse(content: string): Promise<string> {
  const { activeModelId } = useLocalLLMStore.getState()
  if (!activeModelId) {
    throw new Error('No local model selected. Go to Settings > AI Settings > Manage Models.')
  }

  if (!cachedProvider || cachedModelId !== activeModelId) {
    cachedProvider = new LocalLLMProvider()
    cachedProvider.setBridge(getLocalLLMBridge())
    cachedProvider.setActiveModel(activeModelId)
    await cachedProvider.initialize()
    cachedModelId = activeModelId
  }

  const response = await cachedProvider.complete([
    { role: 'system', content: 'You are CoBrain, a helpful AI thinking partner. Keep responses concise and helpful.' },
    { role: 'user', content },
  ])

  return response.content
}

// Simulated responses for demo purposes
function getSimulatedResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
    return "Hello! I'm CoBrain, your AI thinking partner. How can I help you today?"
  }

  if (lowerQuery.includes('shopping') || lowerQuery.includes('grocery') || lowerQuery.includes('store')) {
    return "Based on your notes, here's what you need from the store:\n\n- Milk\n- Bread\n- Eggs\n- Coffee\n\nWould you like me to add anything else?"
  }

  if (lowerQuery.includes('todo') || lowerQuery.includes('task') || lowerQuery.includes('today')) {
    return "Here are your tasks for today:\n\n1. Review project proposal\n2. Call Mom at 3pm\n3. Submit expense report\n\nYou're doing great! What would you like to focus on first?"
  }

  if (lowerQuery.includes('meeting') || lowerQuery.includes('schedule')) {
    return "Looking at your notes, I found these upcoming meetings:\n\n- Team standup at 10am\n- Product review at 2pm\n- 1:1 with Sarah at 4pm\n\nWould you like me to prepare notes for any of these?"
  }

  return "I searched through your notes but couldn't find specific information about that. Could you try rephrasing your question, or would you like me to help you capture some notes about this topic?"
}
