'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { VoiceBubble, type BubbleState } from '@/components/voice-bubble'
import { SettingsPanel } from '@/components/settings-panel'
import { Settings } from 'lucide-react'

// Check browser support
const isBrowserSupported = () => {
  return typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
}

export default function SmartGuide() {
  const [bubbleState, setBubbleState] = useState<BubbleState>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [amplitude, setAmplitude] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKeys, setApiKeys] = useState({ minimax: '', elevenlabs: '' })
  const [systemPrompt, setSystemPrompt] = useState('')
  const [textInput, setTextInput] = useState('')

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const { messages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
    // Load API keys and system prompt from localStorage
    const savedMinimax = localStorage.getItem('minimax_key') || ''
    const savedElevenLabs = localStorage.getItem('elevenlabs_key') || ''
    const savedSystemPrompt = localStorage.getItem('system_prompt') || ''
    setApiKeys({ minimax: savedMinimax, elevenlabs: savedElevenLabs })
    setSystemPrompt(savedSystemPrompt)
  }, [])

  // Analyze audio amplitude for speaking animation
  const analyzeAmplitude = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedAmplitude = Math.min(average / 128, 1)

    setAmplitude(normalizedAmplitude)

    animationFrameRef.current = requestAnimationFrame(analyzeAmplitude)
  }, [])

  // Convert text to speech using ElevenLabs
  const speakText = useCallback(
    async (text: string) => {
      console.log('[v0] Speaking text:', text)
      console.log('[v0] ElevenLabs key:', apiKeys.elevenlabs ? 'SET' : 'EMPTY')

      if (!apiKeys.elevenlabs) {
        console.log('[v0] No ElevenLabs API key set')
        setError('Please set your ElevenLabs API key in settings')
        setBubbleState('idle')
        setIsSettingsOpen(true)
        return
      }

      setBubbleState('speaking')

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, apiKey: apiKeys.elevenlabs }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.log('[v0] TTS API error status:', response.status)
          console.log('[v0] TTS API error data:', errorData)
          throw new Error(`Failed to generate speech: ${response.status}`)
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        currentAudioRef.current = audio

        // Set up audio context for amplitude analysis
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
        }

        const source = audioContextRef.current.createMediaElementSource(audio)
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256

        source.connect(analyser)
        analyser.connect(audioContextRef.current.destination)

        analyserRef.current = analyser

        audio.onplay = () => {
          console.log('[v0] Audio playback started')
          analyzeAmplitude()
        }

        audio.onended = () => {
          console.log('[v0] Audio playback ended')
          setBubbleState('idle')
          setAmplitude(0)
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          URL.revokeObjectURL(audioUrl)
        }

        audio.onerror = (e) => {
          console.error('[v0] Audio playback error:', e)
          setBubbleState('idle')
          setError('Failed to play audio response')
        }

        await audio.play()
      } catch (error) {
        console.error('[v0] Error speaking text:', error)
        console.log(
          '[v0] Error details:',
          error instanceof Error ? error.message : String(error)
        )
        setError('Failed to generate voice response')
        setBubbleState('idle')
      }
    },
    [apiKeys, analyzeAmplitude]
  )

  // Handle sending message and getting response
  const handleSendMessage = useCallback(
    async (text: string) => {
      console.log('[v0] Sending message:', text)
      console.log('[v0] API Keys state:', {
        minimax: apiKeys.minimax ? 'SET' : 'EMPTY',
        elevenlabs: apiKeys.elevenlabs ? 'SET' : 'EMPTY',
      })

      if (!apiKeys.minimax) {
        console.log('[v0] No MiniMax API key set')
        setError('Please set your MiniMax API key in settings')
        setBubbleState('idle')
        setIsSettingsOpen(true)
        return
      }

      setBubbleState('thinking')
      setTranscript('')

      try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: text }],
          apiKey: apiKeys.minimax,
          systemPrompt: systemPrompt,
        }),
      })

        if (!response.ok) {
          const errorText = await response.text()
          console.log('[v0] Chat API response status:', response.status)
          console.log('[v0] Chat API response body:', errorText)
          throw new Error(`Failed to get response: ${response.status}`)
        }

        const data = await response.json()
        const assistantMessage = data.message

        console.log('[v0] Assistant response:', assistantMessage)

        if (assistantMessage) {
          await speakText(assistantMessage)
        } else {
          setBubbleState('idle')
        }
      } catch (error) {
        console.error('[v0] Error handling message:', error)
        console.log(
          '[v0] Error details:',
          error instanceof Error ? error.message : String(error)
        )
        setError('Failed to get response from assistant')
        setBubbleState('idle')
      }
    },
    [apiKeys, messages, speakText, systemPrompt]
  )

  // Initialize speech recognition
  useEffect(() => {
    if (!isBrowserSupported()) {
      setError(
        'Voice recognition is not supported in your browser. Please use Chrome or Edge.'
      )
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[v0] Speech recognition started')
      setIsRecording(true)
      setBubbleState('listening')
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const transcriptText = event.results[current][0].transcript
      console.log('[v0] Transcript:', transcriptText)
      setTranscript(transcriptText)
    }

    recognition.onerror = (event: any) => {
      console.log('[v0] Speech recognition error:', event.error)
      setIsRecording(false)
      setBubbleState('idle')

      // Don't show error for common non-critical issues
      if (event.error === 'no-speech') {
        // User didn't speak, just return to idle
        return
      } else if (event.error === 'aborted') {
        // User manually stopped, no error needed
        return
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.')
      } else {
        setError(`Voice recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      console.log('[v0] Speech recognition ended')
      setIsRecording(false)

      if (transcript.trim()) {
        handleSendMessage(transcript)
      } else {
        setBubbleState('idle')
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [handleSendMessage, transcript])

  // Handle bubble click
  const handleBubbleClick = () => {
    if (bubbleState === 'speaking') {
      // Stop current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }
      setBubbleState('idle')
      setAmplitude(0)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop()
    } else {
      // Start recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('[v0] Error starting recognition:', error)
          setError('Failed to start voice recognition')
        }
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-purple-950/20 pointer-events-none" />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          setApiKeys({ minimax: settings.minimax, elevenlabs: settings.elevenlabs })
          setSystemPrompt(settings.systemPrompt)
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Bubble */}
        <VoiceBubble state={bubbleState} amplitude={amplitude} onClick={handleBubbleClick} />

        {/* Status text */}
        <div className="text-center space-y-4">
          <p className="text-2xl font-medium text-zinc-100">
            {bubbleState === 'idle' && 'Click to speak'}
            {bubbleState === 'listening' && 'Listening...'}
            {bubbleState === 'thinking' && 'Processing...'}
            {bubbleState === 'speaking' && 'Speaking...'}
          </p>

          {transcript && bubbleState === 'listening' && (
            <p className="text-sm text-zinc-400 max-w-md">{transcript}</p>
          )}

          {error && <p className="text-sm text-red-400 max-w-md">{error}</p>}

          {isMounted && !isBrowserSupported() && (
            <p className="text-sm text-yellow-400 max-w-md">
              Voice recognition requires Chrome or Edge browser
            </p>
          )}

          {/* Text input box */}
          <div className="mt-6 w-full max-w-md flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && textInput.trim()) {
                  handleSendMessage(textInput.trim())
                  setTextInput('')
                }
              }}
              placeholder="Or type a message..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={bubbleState === 'thinking' || bubbleState === 'speaking'}
            />
            <button
              onClick={() => {
                if (textInput.trim()) {
                  handleSendMessage(textInput.trim())
                  setTextInput('')
                }
              }}
              disabled={bubbleState === 'thinking' || bubbleState === 'speaking' || !textInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-600 text-white rounded-lg transition-colors font-medium"
            >
              Send
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1 text-zinc-500 text-sm max-w-md">
          <p>Click the bubble to start talking</p>
          <p>Click again while speaking to stop</p>
          <p>Click while assistant is speaking to interrupt</p>
        </div>
      </div>

      {/* Corner branding */}
      <div className="absolute bottom-6 right-6 text-zinc-600 text-xs font-mono">
        Smart Guide v1.0
      </div>

      {/* Settings button */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="absolute top-6 right-6 z-20 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
        title="API Keys"
      >
        <Settings size={20} />
      </button>
    </div>
  )
}
