'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type OnboardingStep = 'welcome' | 'first-capture' | 'ai-demo' | 'tips' | 'done'

const STEP_ORDER: OnboardingStep[] = ['welcome', 'first-capture', 'ai-demo', 'tips', 'done']

interface StepConfig {
  title: string
  description: string
}

const STEPS: Record<OnboardingStep, StepConfig> = {
  welcome: {
    title: 'Welcome to CoBrain',
    description: 'Your AI thinking partner. Let\'s get you started in under 5 minutes.',
  },
  'first-capture': {
    title: 'Capture Your First Thought',
    description: 'Type anything that\'s on your mind. No organization needed.',
  },
  'ai-demo': {
    title: 'See the AI in Action',
    description: 'Watch CoBrain automatically extract and organize information.',
  },
  tips: {
    title: 'Quick Tips',
    description: 'A few things to help you get the most out of CoBrain.',
  },
  done: {
    title: 'You\'re All Set!',
    description: 'Start capturing your thoughts. CoBrain will handle the rest.',
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [firstNote, setFirstNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedInfo, setExtractedInfo] = useState<{
    entities: string[]
    reminders: string[]
  } | null>(null)

  const currentIndex = STEP_ORDER.indexOf(currentStep)
  const progress = ((currentIndex + 1) / STEP_ORDER.length) * 100

  const nextStep = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex])
    }
  }, [currentIndex])

  const prevStep = useCallback(() => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex])
    }
  }, [currentIndex])

  const skipOnboarding = useCallback(() => {
    localStorage.setItem('cobrain-onboarding-complete', 'true')
    router.push('/capture')
  }, [router])

  const handleFirstNoteSubmit = useCallback(async () => {
    if (!firstNote.trim()) return

    setIsProcessing(true)
    try {
      // Save the note
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: firstNote, source: 'text' }),
      })

      if (!response.ok) throw new Error('Failed to save')

      // Simulate AI extraction (in real app, this would call the extraction API)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Demo extracted info
      const demoEntities: string[] = []
      const demoReminders: string[] = []

      // Simple extraction demo
      if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(firstNote)) {
        demoEntities.push('Person detected')
      }
      if (/tomorrow|next week|monday|tuesday|wednesday|thursday|friday/i.test(firstNote)) {
        demoReminders.push('Time reference found')
      }
      if (/remind|call|meet|send|email/i.test(firstNote)) {
        demoReminders.push('Action item detected')
      }
      if (/project|task|work|meeting/i.test(firstNote)) {
        demoEntities.push('Topic identified')
      }

      setExtractedInfo({
        entities: demoEntities.length > 0 ? demoEntities : ['No specific entities found (but that\'s OK!)'],
        reminders: demoReminders.length > 0 ? demoReminders : ['No reminders detected'],
      })

      nextStep()
    } catch (error) {
      console.error('Failed to process note:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [firstNote, nextStep])

  const finishOnboarding = useCallback(() => {
    localStorage.setItem('cobrain-onboarding-complete', 'true')
    router.push('/capture')
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Skip button */}
      <button
        onClick={skipOnboarding}
        className="fixed top-4 right-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        Skip
      </button>

      <div className="max-w-lg w-full">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {STEP_ORDER.map((step, i) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">{STEPS[currentStep].title}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {STEPS[currentStep].description}
          </p>
        </div>

        {/* Step-specific content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-800">
          {currentStep === 'welcome' && (
            <div className="space-y-6">
              <div className="text-6xl text-center mb-6">🧠</div>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Zero organization required</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>AI automatically extracts entities</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Natural language search</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>Proactive reminders</span>
                </li>
              </ul>
              <button
                onClick={nextStep}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {currentStep === 'first-capture' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Try something like: &quot;Remind me to call John tomorrow at 2pm about the project&quot;
              </p>
              <textarea
                value={firstNote}
                onChange={(e) => setFirstNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleFirstNoteSubmit}
                disabled={!firstNote.trim() || isProcessing}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Save & Continue'}
              </button>
            </div>
          )}

          {currentStep === 'ai-demo' && extractedInfo && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Your note:
                </p>
                <p className="text-gray-700 dark:text-gray-300">{firstNote}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Entities Detected:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedInfo.entities.map((entity, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Reminders/Actions:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedInfo.reminders.map((reminder, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm"
                      >
                        {reminder}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                All of this happens automatically, every time you capture a thought!
              </p>

              <button
                onClick={nextStep}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 'tips' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎤</span>
                  <div>
                    <p className="font-medium">Voice Input</p>
                    <p className="text-sm text-gray-500">
                      Click the microphone to speak your thoughts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⌨️</span>
                  <div>
                    <p className="font-medium">Quick Capture</p>
                    <p className="text-sm text-gray-500">
                      Press Ctrl+Shift+C anywhere for instant capture
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="font-medium">Natural Search</p>
                    <p className="text-sm text-gray-500">
                      Ask &quot;What do I need to do today?&quot; in Chat
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 'done' && (
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <p className="text-lg">
                You&apos;re ready to start using CoBrain!
              </p>
              <p className="text-sm text-gray-500">
                Remember: just capture your thoughts naturally. CoBrain handles the organization.
              </p>
              <button
                onClick={finishOnboarding}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Start Using CoBrain
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep !== 'welcome' && currentStep !== 'done' && (
          <button
            onClick={prevStep}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
