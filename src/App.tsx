import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PiGenerator } from './lib/piGenerator'
import { AudioEngine } from './lib/audioEngine'
import { SynthControls } from './components/SynthControls'
import defaults from './config/defaults.json'
// @ts-ignore - no types available for react-fps-stats
import FPSStats from 'react-fps-stats'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDigitIndex, setCurrentDigitIndex] = useState(1) // Start at 1 to show "3."
  const [tempo, setTempo] = useState(defaults.tempo) // 180 BPM from defaults
  const [showSettings, setShowSettings] = useState(defaults.ui.showSettings)
  const [showFPS, setShowFPS] = useState(defaults.ui.showFPS)
  const [color1, setColor1] = useState(defaults.colors.color1)
  const [color2, setColor2] = useState(defaults.colors.color2)
  const [piDigits, setPiDigits] = useState(defaults.display.initialPiDigits)
  const [activeTab, setActiveTab] = useState<'general' | 'percussion' | 'dark' | 'light' | 'debug'>('general')
  const [debugEvents, setDebugEvents] = useState<string[]>([])
  
  // Dark Theme Reverb State (7 parameters)
  const [darkReverbDecay, setDarkReverbDecay] = useState(3.0)
  const [darkReverbWet, setDarkReverbWet] = useState(50)
  const [darkReverbPreDelay, setDarkReverbPreDelay] = useState(0)
  const [darkReverbRoomSize, setDarkReverbRoomSize] = useState(2.0)
  const [darkReverbDamping, setDarkReverbDamping] = useState(4000)
  const [darkReverbEarlyLate, setDarkReverbEarlyLate] = useState(50)
  const [darkReverbStereoWidth, setDarkReverbStereoWidth] = useState(100)
  
  // Light Theme Reverb State (7 parameters) 
  const [lightReverbDecay, setLightReverbDecay] = useState(1.5)
  const [lightReverbWet, setLightReverbWet] = useState(30)
  const [lightReverbPreDelay, setLightReverbPreDelay] = useState(0)
  const [lightReverbRoomSize, setLightReverbRoomSize] = useState(2.0)
  const [lightReverbDamping, setLightReverbDamping] = useState(6000)
  const [lightReverbEarlyLate, setLightReverbEarlyLate] = useState(50)
  const [lightReverbStereoWidth, setLightReverbStereoWidth] = useState(100)
  
  // Pi generator instance
  const piGenerator = useRef(new PiGenerator())
  const initializedRef = useRef(false)
  
  // Audio engine instance
  const audioEngine = useRef(new AudioEngine())
  
  // Debug logging function
  const addDebugEvent = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const eventWithTime = `${timestamp}: ${message}`
    setDebugEvents(prev => [eventWithTime, ...prev.slice(0, 24)]) // Keep last 25 events
  }, [])
  
  // Generate initial digits
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      // Start with just "3." and generate as needed
      setPiDigits('3.')
      // Set up debug callback
      audioEngine.current.setDebugCallback(addDebugEvent)
    }
  }, [addDebugEvent])
  
  // Generate more digits when needed (but limit total to prevent crashes)
  useEffect(() => {
    if (currentDigitIndex >= piDigits.length - 10 && piDigits.length < 500) {
      // Generate 50 more digits when we're within 10 digits of the end
      // Limit to 500 total digits to prevent memory issues
      const newDigits = piGenerator.current.generateDigits(50)
      setPiDigits(prev => prev + newDigits)
    }
  }, [currentDigitIndex, piDigits.length])

  // Update CSS custom properties when colors change
  useEffect(() => {
    document.documentElement.style.setProperty('--color-1', color1)
    document.documentElement.style.setProperty('--color-2', color2)
  }, [color1, color2])

  // Cleanup audio engine on unmount
  useEffect(() => {
    return () => {
      audioEngine.current.dispose()
    }
  }, [])

  // Auto-scroll functionality
  const digitDisplayRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!digitDisplayRef.current) return
    
    // Get the current digit element
    const currentDigitElement = digitDisplayRef.current.querySelector(`[data-index="${currentDigitIndex}"]`) as HTMLElement
    
    if (currentDigitElement) {
      // Check if we need to scroll
      const containerRect = digitDisplayRef.current.getBoundingClientRect()
      const digitRect = currentDigitElement.getBoundingClientRect()
      
      // Scroll when digit is near bottom of viewport (leaving some margin)
      const marginFromBottom = 200
      
      if (digitRect.bottom > window.innerHeight - marginFromBottom) {
        currentDigitElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }, [currentDigitIndex])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isPlaying) {
          // Initialize audio on first play
          audioEngine.current.initialize().then(() => {
            setIsPlaying(true)
          })
        } else {
          setIsPlaying(false)
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setShowSettings(!showSettings)
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFPS(!showFPS)
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setShowSettings(true)
        setActiveTab('debug')
      }
      
      // Debug keys - trigger synths directly
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        
        // Update theme if 0 or 1 pressed
        if (e.key === '0') {
          setCurrentTheme('dark')
          addDebugEvent('🌙 Manual key 0: Switched to DARK theme')
        } else if (e.key === '1') {
          setCurrentTheme('light')
          addDebugEvent('☀️ Manual key 1: Switched to LIGHT theme')
        }
        
        // Initialize audio if needed
        if (!audioEngine.current.initialized) {
          audioEngine.current.initialize().then(() => {
            addDebugEvent(`🎹 Manual key: ${e.key}`)
            audioEngine.current.playDigit(e.key)
          })
        } else {
          addDebugEvent(`🎹 Manual key: ${e.key}`)
          audioEngine.current.playDigit(e.key)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, showSettings, showFPS, addDebugEvent])

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return

    const intervalMs = 60000 / tempo // 120 BPM = 500ms per digit = 2 digits/sec
    
    const interval = setInterval(() => {
      setCurrentDigitIndex(prev => {
        if (prev >= piDigits.length - 1) {
          setIsPlaying(false) // Stop at end
          return prev
        }
        const newIndex = prev + 1
        // Play audio for the new digit
        const digit = piDigits[newIndex]
        if (digit && digit !== '.') {
          addDebugEvent(`🎵 Playing digit: ${digit}`)
          audioEngine.current.playDigit(digit)
        }
        return newIndex
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isPlaying, tempo, piDigits.length]) // Add all dependencies

  // Get current digit being played
  const currentDigit = piDigits[currentDigitIndex] || '3'
  
  // Determine colors based on current digit
  // When 1 plays: light theme (black text on white background) 
  // When 0 plays: dark theme (white text on black background)
  // When 2-9 play: keep whatever theme was last set by 0 or 1
  const [currentTheme, setCurrentTheme] = useState('dark') // Start with dark theme
  
  // Copy debug logs to clipboard
  const copyDebugToClipboard = useCallback(() => {
    const debugText = [
      `=== AUDIO DEBUG LOG ===`,
      `Theme: ${currentTheme} | Playing: ${isPlaying ? 'Yes' : 'No'} | Current: ${currentDigit}`,
      `Generated at: ${new Date().toISOString()}`,
      ``,
      ...debugEvents
    ].join('\n')
    
    navigator.clipboard.writeText(debugText).then(() => {
      addDebugEvent('📋 Debug log copied to clipboard!')
    }).catch(() => {
      addDebugEvent('❌ Failed to copy to clipboard')
    })
  }, [debugEvents, currentTheme, isPlaying, currentDigit, addDebugEvent])
  
  useEffect(() => {
    if (currentDigit === '0') {
      setCurrentTheme('dark') // Dark theme: white text on black bg
    } else if (currentDigit === '1') {
      setCurrentTheme('light') // Light theme: black text on white bg
    }
    // For digits 2-9, keep current theme unchanged
  }, [currentDigit])
  
  const useColor1Background = currentTheme === 'light'

  return (
    <div 
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        useColor1Background ? 'pi-theme-hihat' : 'pi-theme-kick'
      }`}
    >
      {/* FPS Stats - toggle with 'F' key */}
      {showFPS && <FPSStats top="auto" right={20} bottom={100} left="auto" />}
      
      
      {/* Main digit display area */}
      <div 
        ref={digitDisplayRef}
        className="absolute top-8 left-8 right-8 bottom-24 overflow-auto"
      >
        <div className="text-6xl md:text-8xl font-mono leading-tight tracking-wider break-words pb-96">
          {piDigits.slice(0, currentDigitIndex + 1).split('').map((digit, index) => (
            <span
              key={index}
              data-index={index}
              className={`${
                index === currentDigitIndex 
                  ? 'opacity-100 font-bold' 
                  : 'opacity-40'
              }`}
            >
              {digit}
            </span>
          ))}
        </div>
      </div>

      {/* Control buttons */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-4">
        {/* Play/Pause button */}
        <button
          onClick={() => {
            if (!isPlaying) {
              // Initialize audio on first play
              audioEngine.current.initialize().then(() => {
                setIsPlaying(true)
              })
            } else {
              setIsPlaying(false)
            }
          }}
          className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-2xl"
          title="Play/Pause (Space)"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        {/* Hamburger menu */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          title="Settings (P)"
        >
          <div className="flex flex-col gap-1">
            <div className="w-6 h-0.5 bg-black"></div>
            <div className="w-6 h-0.5 bg-black"></div>
            <div className="w-6 h-0.5 bg-black"></div>
          </div>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed top-8 right-8 bg-white text-black rounded-lg shadow-lg min-w-80 max-w-96">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'general', label: 'General' },
              { id: 'percussion', label: 'Percussion' },
              { id: 'dark', label: 'Dark' },
              { id: 'light', label: 'Light' },
              { id: 'debug', label: 'Debug' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">General Settings</h3>
                
                <div>
                  <label htmlFor="tempo-slider" className="block text-sm font-medium mb-2">
                    Tempo: {tempo} BPM ({(tempo/60).toFixed(1)} digits/sec)
                  </label>
                  <input
                    id="tempo-slider"
                    name="tempo"
                    type="range"
                    min={defaults.ui.tempoRange.min}
                    max={defaults.ui.tempoRange.max}
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>60</span>
                    <span>120</span>
                    <span className="font-bold">180</span>
                    <span>240</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label htmlFor="color1-picker" className="block text-sm font-medium mb-2">
                      Color 1 (Hi-hat background)
                    </label>
                    <input
                      id="color1-picker"
                      name="color1"
                      type="color"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="color2-picker" className="block text-sm font-medium mb-2">
                      Color 2 (Kick/Melody background)
                    </label>
                    <input
                      id="color2-picker"
                      name="color2"
                      type="color"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 border-t pt-3">
                  <p><strong>0:</strong> Kick Drum</p>
                  <p><strong>1:</strong> Hi-Hat</p>
                  <p><strong>2-9:</strong> Musical Notes</p>
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-3">
                  <p>🔢 Generating real π mathematically</p>
                  <p>Digits generated: {piDigits.length}</p>
                  <p>Current position: {currentDigitIndex + 1}</p>
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-3">
                  <p><strong>Keyboard shortcuts:</strong></p>
                  <p><kbd>Space</kbd> - Play/Pause</p>
                  <p><kbd>P</kbd> - Settings panel</p>
                  <p><kbd>F</kbd> - Show FPS stats</p>
                  <p><kbd>D</kbd> - Debug panel</p>
                  <p><kbd>0-9</kbd> - Manual synth trigger (debug)</p>
                </div>
              </div>
            )}

            {/* Percussion Tab - Combined Kick and Hi-hat */}
            {activeTab === 'percussion' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Percussion Settings</h3>
                
                {/* Kick Drum Section */}
                <details open className="border border-gray-200 rounded-lg">
                  <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <span className="font-semibold text-sm">🥁 Kick Drum (0)</span>
                  </summary>
                  <div className="p-4 space-y-3">
                    <div>
                      <label htmlFor="kick-pitch-decay" className="block text-sm font-medium mb-2">
                        Pitch Decay: 0.05
                      </label>
                      <input
                        id="kick-pitch-decay"
                        name="kickPitchDecay"
                        type="range"
                        min="0.01"
                        max="0.2"
                        step="0.01"
                        defaultValue="0.05"
                        onChange={(e) => {
                          if (audioEngine.current.initialized) {
                            audioEngine.current.setKickPitchDecay(Number(e.target.value))
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Controls how quickly the pitch drops
                      </div>
                    </div>

                    <div>
                      <label htmlFor="kick-octaves" className="block text-sm font-medium mb-2">
                        Octaves: 10
                      </label>
                      <input
                        id="kick-octaves"
                        name="kickOctaves"
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        defaultValue="10"
                        onChange={(e) => {
                          if (audioEngine.current.initialized) {
                            audioEngine.current.setKickOctaves(Number(e.target.value))
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Number of octaves the pitch envelope drops
                      </div>
                    </div>
                  </div>
                </details>

                {/* Hi-hat Section */}
                <details open className="border border-gray-200 rounded-lg">
                  <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <span className="font-semibold text-sm">🎩 Hi-hat (1)</span>
                  </summary>
                  <div className="p-4 space-y-3">
                    <div>
                      <label htmlFor="hihat-resonance" className="block text-sm font-medium mb-2">
                        Resonance: 300
                      </label>
                      <input
                        id="hihat-resonance"
                        name="hihatResonance"
                        type="range"
                        min="100"
                        max="1000"
                        step="10"
                        defaultValue="300"
                        onChange={(e) => {
                          if (audioEngine.current.initialized) {
                            audioEngine.current.setHihatResonance(Number(e.target.value))
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Controls the metallic resonance
                      </div>
                    </div>

                    <div>
                      <label htmlFor="hihat-frequency" className="block text-sm font-medium mb-2">
                        Frequency: 200Hz
                      </label>
                      <input
                        id="hihat-frequency"
                        name="hihatFrequency"
                        type="range"
                        min="100"
                        max="500"
                        step="5"
                        defaultValue="200"
                        onChange={(e) => {
                          if (audioEngine.current.initialized) {
                            audioEngine.current.setHihatFrequency(Number(e.target.value))
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Base frequency of the metallic sound
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Dark Tab - Dark synth and reverb settings */}
            {activeTab === 'dark' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">🌙 Dark Theme</h3>
                <p className="text-sm text-gray-600 mb-4">Controls for dark melody (2-9) and kick drum reverb</p>
                
                {/* Synth Section */}
                <details open className="border border-gray-800 rounded-lg">
                  <summary className="px-4 py-3 bg-gray-800 text-white cursor-pointer hover:bg-gray-700 transition-colors">
                    <span className="font-semibold text-sm">🎹 Synthesizer</span>
                  </summary>
                  <div className="p-4 bg-gray-50">
                    <SynthControls
                      synthType="dark"
                      onEnvelopeChange={(envelope) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setDarkSynthEnvelope(envelope)
                        }
                      }}
                      onOscillatorChange={(oscillator) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setDarkSynthOscillator(oscillator)
                        }
                      }}
                      onPortamentoChange={(portamento) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setDarkSynthPortamento(portamento)
                        }
                      }}
                      onDetuneChange={(detune) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setDarkSynthDetune(detune)
                        }
                      }}
                    />
                  </div>
                </details>

                {/* Reverb Section */}
                <details open className="border border-gray-800 rounded-lg">
                  <summary className="px-4 py-3 bg-gray-800 text-white cursor-pointer hover:bg-gray-700 transition-colors">
                    <span className="font-semibold text-sm">🌊 Reverb</span>
                  </summary>
                  <div className="p-4 space-y-3 bg-gray-50">
                    <div>
                      <label htmlFor="dark-reverb-decay" className="block text-sm font-medium mb-1">
                        Decay Time: {darkReverbDecay.toFixed(1)}s
                      </label>
                      <input id="dark-reverb-decay" type="range" min="0.1" max="10" step="0.1" value={darkReverbDecay}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbDecay(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbDecay(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-wet" className="block text-sm font-medium mb-1">
                        Wet/Dry Mix: {darkReverbWet}%
                      </label>
                      <input id="dark-reverb-wet" type="range" min="0" max="100" step="1" value={darkReverbWet}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbWet(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbWet(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-predelay" className="block text-sm font-medium mb-1">
                        Pre-delay: {darkReverbPreDelay}ms
                      </label>
                      <input id="dark-reverb-predelay" type="range" min="0" max="200" step="1" value={darkReverbPreDelay}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbPreDelay(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbPreDelay(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-roomsize" className="block text-sm font-medium mb-1">
                        Room Size: {darkReverbRoomSize.toFixed(1)}
                      </label>
                      <input id="dark-reverb-roomsize" type="range" min="0.5" max="10.0" step="0.1" value={darkReverbRoomSize}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbRoomSize(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbRoomSize(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-damping" className="block text-sm font-medium mb-1">
                        Damping: {darkReverbDamping}Hz
                      </label>
                      <input id="dark-reverb-damping" type="range" min="0" max="8000" step="100" value={darkReverbDamping}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbDamping(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbDamping(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-earlylate" className="block text-sm font-medium mb-1">
                        Early/Late Balance: {darkReverbEarlyLate}%
                      </label>
                      <input id="dark-reverb-earlylate" type="range" min="0" max="100" step="1" value={darkReverbEarlyLate}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbEarlyLate(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbEarlyLateBalance(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="dark-reverb-width" className="block text-sm font-medium mb-1">
                        Stereo Width: {darkReverbStereoWidth}%
                      </label>
                      <input id="dark-reverb-width" type="range" min="0" max="200" step="1" value={darkReverbStereoWidth}
                        onChange={(e) => { const val = Number(e.target.value); setDarkReverbStereoWidth(val); if (audioEngine.current.initialized) audioEngine.current.setDarkReverbStereoWidth(val); }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Light Tab - Light synth and reverb settings */}
            {activeTab === 'light' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">☀️ Light Theme</h3>
                <p className="text-sm text-gray-600 mb-4">Controls for light melody (2-9) and hi-hat reverb</p>
                
                {/* Synth Section */}
                <details open className="border border-blue-200 rounded-lg">
                  <summary className="px-4 py-3 bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200 transition-colors">
                    <span className="font-semibold text-sm">🎹 Synthesizer</span>
                  </summary>
                  <div className="p-4 bg-blue-50">
                    <SynthControls
                      synthType="light"
                      onEnvelopeChange={(envelope) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setLightSynthEnvelope(envelope)
                        }
                      }}
                      onOscillatorChange={(oscillator) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setLightSynthOscillator(oscillator)
                        }
                      }}
                      onPortamentoChange={(portamento) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setLightSynthPortamento(portamento)
                        }
                      }}
                      onDetuneChange={(detune) => {
                        if (audioEngine.current.initialized) {
                          audioEngine.current.setLightSynthDetune(detune)
                        }
                      }}
                    />
                  </div>
                </details>

                {/* Reverb Section */}
                <details open className="border border-blue-200 rounded-lg">
                  <summary className="px-4 py-3 bg-blue-100 text-blue-900 cursor-pointer hover:bg-blue-200 transition-colors">
                    <span className="font-semibold text-sm">🌊 Reverb</span>
                  </summary>
                  <div className="p-4 space-y-3 bg-blue-50">
                    <div>
                      <label htmlFor="light-reverb-decay" className="block text-sm font-medium mb-1">
                        Decay Time: {lightReverbDecay.toFixed(1)}s
                      </label>
                      <input id="light-reverb-decay" type="range" min="0.1" max="10" step="0.1" value={lightReverbDecay}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbDecay(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbDecay(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-wet" className="block text-sm font-medium mb-1">
                        Wet/Dry Mix: {lightReverbWet}%
                      </label>
                      <input id="light-reverb-wet" type="range" min="0" max="100" step="1" value={lightReverbWet}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbWet(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbWet(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-predelay" className="block text-sm font-medium mb-1">
                        Pre-delay: {lightReverbPreDelay}ms
                      </label>
                      <input id="light-reverb-predelay" type="range" min="0" max="200" step="1" value={lightReverbPreDelay}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbPreDelay(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbPreDelay(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-roomsize" className="block text-sm font-medium mb-1">
                        Room Size: {lightReverbRoomSize.toFixed(1)}
                      </label>
                      <input id="light-reverb-roomsize" type="range" min="0.5" max="10.0" step="0.1" value={lightReverbRoomSize}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbRoomSize(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbRoomSize(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-damping" className="block text-sm font-medium mb-1">
                        Damping: {lightReverbDamping}Hz
                      </label>
                      <input id="light-reverb-damping" type="range" min="0" max="8000" step="100" value={lightReverbDamping}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbDamping(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbDamping(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-earlylate" className="block text-sm font-medium mb-1">
                        Early/Late Balance: {lightReverbEarlyLate}%
                      </label>
                      <input id="light-reverb-earlylate" type="range" min="0" max="100" step="1" value={lightReverbEarlyLate}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbEarlyLate(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbEarlyLateBalance(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div>
                      <label htmlFor="light-reverb-width" className="block text-sm font-medium mb-1">
                        Stereo Width: {lightReverbStereoWidth}%
                      </label>
                      <input id="light-reverb-width" type="range" min="0" max="200" step="1" value={lightReverbStereoWidth}
                        onChange={(e) => { const val = Number(e.target.value); setLightReverbStereoWidth(val); if (audioEngine.current.initialized) audioEngine.current.setLightReverbStereoWidth(val); }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Debug Tab */}
            {activeTab === 'debug' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">🎵 Audio Debug</h3>
                
                <div className="text-sm text-gray-700 mb-3 pb-2 border-b border-gray-300">
                  <div>Theme: <span className="text-orange-600 font-semibold">{currentTheme}</span></div>
                  <div>Playing: <span className={isPlaying ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{isPlaying ? 'Yes' : 'No'}</span></div>
                  <div>Current: <span className="text-blue-600 font-semibold">{currentDigit}</span></div>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-1 mb-3 bg-gray-50 p-2 rounded border">
                  {debugEvents.length === 0 ? (
                    <div className="text-gray-500 italic">No audio events yet...</div>
                  ) : (
                    debugEvents.map((event, index) => (
                      <div key={index} className="text-xs leading-tight text-gray-800 break-words font-mono">
                        {event}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      addDebugEvent('🔍 MANUAL TEST - button clicked!')
                      audioEngine.current.showEffectsStatus()
                    }}
                    type="button"
                    className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer font-medium"
                  >
                    🎛️ Show Effects Status
                  </button>
                  <button
                    onClick={() => audioEngine.current.testMelodySynth()}
                    type="button"
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer font-medium"
                  >
                    🧪 Test Melody Synth
                  </button>
                  <button
                    onClick={copyDebugToClipboard}
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer font-medium"
                  >
                    📋 Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App