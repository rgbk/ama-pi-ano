import { useEffect, useRef } from 'react'

interface EnvelopeVisualizerProps {
  attack: number
  decay: number
  sustain: number
  release: number
  width?: number
  height?: number
  color?: string
}

export function EnvelopeVisualizer({ 
  attack, 
  decay, 
  sustain, 
  release,
  width = 200,
  height = 80,
  color = '#3B82F6'
}: EnvelopeVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate envelope segments
    const totalTime = attack + decay + release + 0.5 // Add some hold time
    const attackX = (attack / totalTime) * width
    const decayX = ((attack + decay) / totalTime) * width
    const releaseStartX = ((attack + decay + 0.5) / totalTime) * width
    const releaseEndX = width

    const sustainY = height - (sustain * height * 0.8) // Leave some margin

    // Draw background grid
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw envelope curve
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    
    // Start at bottom left
    ctx.moveTo(0, height)
    
    // Attack: rise to peak
    ctx.lineTo(attackX, height * 0.1)
    
    // Decay: fall to sustain level
    ctx.lineTo(decayX, sustainY)
    
    // Sustain: hold level
    ctx.lineTo(releaseStartX, sustainY)
    
    // Release: fall to zero
    ctx.lineTo(releaseEndX, height)
    
    ctx.stroke()

    // Fill area under curve
    ctx.fillStyle = color + '20' // Add transparency
    ctx.fill()

    // Add labels
    ctx.fillStyle = '#6B7280'
    ctx.font = '10px sans-serif'
    ctx.fillText('A', attackX / 2, height - 5)
    ctx.fillText('D', attackX + (decayX - attackX) / 2, height - 5)
    ctx.fillText('S', decayX + (releaseStartX - decayX) / 2, height - 5)
    ctx.fillText('R', releaseStartX + (releaseEndX - releaseStartX) / 2, height - 5)

  }, [attack, decay, sustain, release, width, height, color])

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      className="border border-gray-200 rounded"
    />
  )
}