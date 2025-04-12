"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ConfettiProps {
  count?: number
}

export function Confetti({ count = 50 }: ConfettiProps) {
  const [confetti, setConfetti] = useState<
    Array<{
      id: number
      x: number
      y: number
      color: string
      size: number
      rotation: number
      animationDuration: string
    }>
  >([])

  useEffect(() => {
    const newConfetti = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 100,
      color: ["confetti-pink", "confetti-blue", "confetti-yellow"][Math.floor(Math.random() * 3)],
      size: 5 + Math.random() * 10,
      rotation: Math.random() * 360,
      animationDuration: ["animate-confetti-slow", "animate-confetti-medium", "animate-confetti-fast"][
        Math.floor(Math.random() * 3)
      ],
    }))

    setConfetti(newConfetti)
  }, [count])

  return (
    <div className="confetti-wrapper">
      {confetti.map((c) => (
        <div
          key={c.id}
          className={`confetti ${c.color} ${c.animationDuration}`}
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function FestiveBackground({ children }: { children: React.ReactNode }) {
  return <div className="festive-bg min-h-screen">{children}</div>
}

export function BalloonBackground({ children }: { children: React.ReactNode }) {
  return <div className="balloon-bg min-h-screen">{children}</div>
}

export function GiftBackground({ children }: { children: React.ReactNode }) {
  return <div className="gift-bg min-h-screen">{children}</div>
}

