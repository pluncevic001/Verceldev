'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export type BubbleState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceBubbleProps {
  state: BubbleState
  amplitude?: number
  onClick?: () => void
}

export function VoiceBubble({ state, amplitude = 0, onClick }: VoiceBubbleProps) {
  const [ripples, setRipples] = useState<number[]>([])

  // Generate ripples for speaking state
  useEffect(() => {
    if (state === 'speaking') {
      const interval = setInterval(() => {
        setRipples((prev) => [...prev.slice(-2), Date.now()])
      }, 400)
      return () => clearInterval(interval)
    } else {
      setRipples([])
    }
  }, [state])

  // Color schemes for each state
  const colors = {
    idle: {
      primary: 'rgba(200, 200, 200, 0.4)',
      glow: 'rgba(200, 200, 200, 0.2)',
      shadow: 'rgba(200, 200, 200, 0.3)',
    },
    listening: {
      primary: 'rgba(59, 130, 246, 0.6)',
      glow: 'rgba(59, 130, 246, 0.3)',
      shadow: 'rgba(59, 130, 246, 0.5)',
    },
    thinking: {
      primary: 'rgba(168, 85, 247, 0.6)',
      glow: 'rgba(168, 85, 247, 0.3)',
      shadow: 'rgba(168, 85, 247, 0.5)',
    },
    speaking: {
      primary: 'rgba(251, 146, 60, 0.7)',
      glow: 'rgba(251, 146, 60, 0.4)',
      shadow: 'rgba(251, 146, 60, 0.6)',
    },
  }

  const currentColors = colors[state]

  // Animation variants for the main bubble
  const bubbleVariants = {
    idle: {
      scale: 1,
      opacity: 0.8,
      boxShadow: `0 0 60px 20px ${currentColors.shadow}`,
    },
    listening: {
      scale: 1.1,
      opacity: 0.9,
      boxShadow: `0 0 80px 30px ${currentColors.shadow}`,
    },
    thinking: {
      scale: [0.95, 1.05, 0.95],
      opacity: 0.85,
      boxShadow: `0 0 70px 25px ${currentColors.shadow}`,
    },
    speaking: {
      scale: 1 + amplitude * 0.15,
      opacity: 0.9,
      boxShadow: `0 0 90px ${35 + amplitude * 20}px ${currentColors.shadow}`,
    },
  }

  const transitionConfig = {
    idle: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    listening: { duration: 0.5, ease: 'easeOut' },
    thinking: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    speaking: { duration: 0.1, ease: 'linear' },
  }

  return (
    <div className="relative flex items-center justify-center" onClick={onClick}>
      {/* Ripples for listening state */}
      {state === 'listening' && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="absolute rounded-full border-2"
              style={{
                borderColor: currentColors.primary,
                width: 200,
                height: 200,
              }}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{
                scale: [0.8, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Gradient waves for thinking state */}
      {state === 'thinking' && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3), rgba(20, 184, 166, 0.3))',
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3), rgba(168, 85, 247, 0.3))',
            }}
            animate={{
              rotate: -360,
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
          />
        </>
      )}

      {/* Speaking ripples */}
      {state === 'speaking' &&
        ripples.map((id) => (
          <motion.div
            key={id}
            className="absolute rounded-full border-2"
            style={{
              borderColor: currentColors.primary,
              width: 200,
              height: 200,
            }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{
              scale: 2.5,
              opacity: 0,
            }}
            transition={{
              duration: 1.2,
              ease: 'easeOut',
            }}
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((r) => r !== id))
            }}
          />
        ))}

      {/* Main bubble */}
      <motion.div
        className="relative z-10 rounded-full cursor-pointer"
        style={{
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${currentColors.primary}, ${currentColors.glow})`,
        }}
        variants={bubbleVariants}
        animate={state}
        transition={transitionConfig[state]}
      >
        {/* Inner glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${currentColors.glow}, transparent)`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  )
}
