'use client'

// Settings panel for API key management - v2
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (keys: { minimax: string; elevenlabs: string; systemPrompt: string }) => void
}

export function SettingsPanel({ isOpen, onClose, onSave }: SettingsPanelProps) {
  const [minimaxKey, setMinimaxKey] = useState('')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [saved, setSaved] = useState(false)

  const defaultSystemPrompt = `You are TARS, a highly capable AI assistant with a dry sense of humor and pragmatic personality. Your responses should be:
- Concise and direct, no unnecessary pleasantries
- Calm and measured, even in complex situations
- Occasionally witty with deadpan humor
- Helpful and efficient, focused on solving problems
- Self-aware of your AI nature without being apologetic

Keep responses brief (2-3 sentences max unless asked for more detail). Speak like you're an intelligent robot companion - competent, reliable, and just a bit sardonic.`

  // Load from localStorage after mount only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMinimaxKey(localStorage.getItem('minimax_key') || '')
      setElevenLabsKey(localStorage.getItem('elevenlabs_key') || '')
      setSystemPrompt(localStorage.getItem('system_prompt') || defaultSystemPrompt)
    }
  }, [isOpen])

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('minimax_key', minimaxKey)
      localStorage.setItem('elevenlabs_key', elevenLabsKey)
      localStorage.setItem('system_prompt', systemPrompt || defaultSystemPrompt)
    }
    onSave({ minimax: minimaxKey, elevenlabs: elevenLabsKey, systemPrompt: systemPrompt || defaultSystemPrompt })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              MiniMax API Key
            </label>
            <input
              type="password"
              value={minimaxKey}
              onChange={(e) => setMinimaxKey(e.target.value)}
              placeholder="Enter your MiniMax API key"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Get it from{' '}
              <a
                href="https://platform.minimaxi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                platform.minimaxi.com
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              ElevenLabs API Key
            </label>
            <input
              type="password"
              value={elevenLabsKey}
              onChange={(e) => setElevenLabsKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Get it from{' '}
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                elevenlabs.io
              </a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              System Prompt (AI Personality)
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Write instructions for how the AI should behave..."
              rows={6}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <button
              onClick={() => setSystemPrompt(defaultSystemPrompt)}
              className="text-xs text-blue-400 hover:underline mt-2"
            >
              Reset to default (TARS personality)
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-zinc-300 hover:text-zinc-100 border border-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          Settings are stored locally in your browser
        </p>
      </div>
    </div>
  )
}
