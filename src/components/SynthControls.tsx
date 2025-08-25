import { useState } from 'react'
import { EnvelopeVisualizer } from './EnvelopeVisualizer'
import { DraggableNumberInput } from './DraggableNumberInput'

interface SynthControlsProps {
  synthType: 'dark' | 'light'
  onEnvelopeChange?: (envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }) => void
  onOscillatorChange?: (oscillator: {
    type: OscillatorType
    partialCount?: number
  }) => void
  onPortamentoChange?: (portamento: number) => void
  onDetuneChange?: (detune: number) => void
}

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export function SynthControls({ synthType, onEnvelopeChange, onOscillatorChange, onPortamentoChange, onDetuneChange }: SynthControlsProps) {
  // Default values based on synth type
  const defaults = synthType === 'dark' 
    ? { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.6, oscillator: 'sawtooth' as OscillatorType, portamento: 0, detune: 0 }
    : { attack: 0.08, decay: 0.4, sustain: 0.7, release: 1.0, oscillator: 'sine' as OscillatorType, portamento: 0.05, detune: 0 }

  const [attack, setAttack] = useState(defaults.attack)
  const [decay, setDecay] = useState(defaults.decay)
  const [sustain, setSustain] = useState(defaults.sustain)
  const [release, setRelease] = useState(defaults.release)
  const [oscillatorType, setOscillatorType] = useState<OscillatorType>(defaults.oscillator)
  const [partialCount, setPartialCount] = useState(8)
  const [portamento, setPortamento] = useState(defaults.portamento)
  const [detune, setDetune] = useState(defaults.detune)

  const handleEnvelopeChange = (param: string, value: number) => {
    const newEnvelope = { attack, decay, sustain, release }
    
    switch(param) {
      case 'attack':
        setAttack(value)
        newEnvelope.attack = value
        break
      case 'decay':
        setDecay(value)
        newEnvelope.decay = value
        break
      case 'sustain':
        setSustain(value)
        newEnvelope.sustain = value
        break
      case 'release':
        setRelease(value)
        newEnvelope.release = value
        break
    }
    
    onEnvelopeChange?.(newEnvelope)
  }

  const handleOscillatorTypeChange = (type: OscillatorType) => {
    setOscillatorType(type)
    onOscillatorChange?.({ type, partialCount })
  }

  const handlePartialCountChange = (count: number) => {
    setPartialCount(count)
    onOscillatorChange?.({ type: oscillatorType, partialCount: count })
  }

  const color = synthType === 'dark' ? '#FCD34D' : '#3B82F6'

  return (
    <div className="space-y-4">
      {/* Oscillator Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Oscillator</h4>
        
        <div className="flex gap-2 flex-wrap">
          {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map(type => (
            <button
              key={type}
              onClick={() => handleOscillatorTypeChange(type)}
              className={`
                px-3 py-1 rounded text-xs font-medium transition-colors
                ${oscillatorType === type 
                  ? synthType === 'dark'
                    ? 'bg-gray-800 text-yellow-300'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {oscillatorType === 'sawtooth' && (
          <DraggableNumberInput
            label="Partials"
            value={partialCount}
            onChange={handlePartialCountChange}
            min={1}
            max={32}
            step={1}
            precision={0}
          />
        )}
      </div>

      {/* Envelope Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Envelope</h4>
        
        {/* Visual Envelope */}
        <div className="flex justify-center">
          <EnvelopeVisualizer
            attack={attack}
            decay={decay}
            sustain={sustain}
            release={release}
            color={color}
          />
        </div>

        {/* Envelope Controls */}
        <div className="grid grid-cols-2 gap-3">
          <DraggableNumberInput
            label="Attack"
            value={attack}
            onChange={(v) => handleEnvelopeChange('attack', v)}
            min={0.001}
            max={2}
            step={0.001}
            precision={3}
            unit="s"
          />
          <DraggableNumberInput
            label="Decay"
            value={decay}
            onChange={(v) => handleEnvelopeChange('decay', v)}
            min={0.001}
            max={2}
            step={0.001}
            precision={3}
            unit="s"
          />
          <DraggableNumberInput
            label="Sustain"
            value={sustain}
            onChange={(v) => handleEnvelopeChange('sustain', v)}
            min={0}
            max={1}
            step={0.01}
            precision={2}
          />
          <DraggableNumberInput
            label="Release"
            value={release}
            onChange={(v) => handleEnvelopeChange('release', v)}
            min={0.001}
            max={5}
            step={0.001}
            precision={3}
            unit="s"
          />
        </div>
      </div>

      {/* Portamento and Detune Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Pitch Controls</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <DraggableNumberInput
            label="Portamento"
            value={portamento}
            onChange={(v) => {
              setPortamento(v)
              onPortamentoChange?.(v)
            }}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            unit="s"
          />
          <DraggableNumberInput
            label="Detune"
            value={detune}
            onChange={(v) => {
              setDetune(v)
              onDetuneChange?.(v)
            }}
            min={-100}
            max={100}
            step={1}
            precision={0}
            unit="¢"
          />
        </div>
      </div>
    </div>
  )
}