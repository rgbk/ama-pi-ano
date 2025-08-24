import { useState, useEffect, useCallback, useRef } from 'react'
import { PiGenerator } from './lib/piGenerator'
// @ts-ignore - no types available for react-fps-stats
import FPSStats from 'react-fps-stats'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDigitIndex, setCurrentDigitIndex] = useState(1) // Start at 1 to show "3."
  const [tempo, setTempo] = useState(120) // BPM
  const [showSettings, setShowSettings] = useState(false)
  const [showFPS, setShowFPS] = useState(false)
  const [color1, setColor1] = useState('#FFFFFF') // White
  const [color2, setColor2] = useState('#000000') // Black
  const [piDigits, setPiDigits] = useState('3.')
  
  // Pi generator instance
  const piGenerator = useRef(new PiGenerator())
  const initializedRef = useRef(false)
  
  // Generate initial digits
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      // Generate first 100 digits
      const newDigits = piGenerator.current.generateDigits(100)
      setPiDigits('3.' + newDigits)
    }
  }, [])
  
  // Generate more digits when approaching the end
  useEffect(() => {
    if (currentDigitIndex > piDigits.length - 50 && piDigits.length < 10000) {
      // Generate 100 more digits when we're within 50 digits of the end
      const newDigits = piGenerator.current.generateDigits(100)
      setPiDigits(prev => prev + newDigits)
    }
  }, [currentDigitIndex, piDigits.length])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setShowSettings(!showSettings)
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFPS(!showFPS)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, showSettings, showFPS])

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
        return prev + 1
      })
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isPlaying, tempo, piDigits.length]) // Add all dependencies

  // Get current digit being played
  const currentDigit = piDigits[currentDigitIndex] || '3'
  
  // Determine colors based on current digit
  // When digit 1 plays: use color1 as background, color2 as text
  // When digit 0,2-9 plays: use color2 as background, color1 as text
  const useColor1Background = currentDigit === '1'
  const bgColor = useColor1Background ? color1 : color2
  const textColor = useColor1Background ? color2 : color1

  return (
    <div 
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      {/* FPS Stats - toggle with 'F' key */}
      {showFPS && <FPSStats top="auto" right={20} bottom={100} left="auto" />}
      {/* Main digit display area */}
      <div className="absolute top-8 left-8 right-8 bottom-24">
        <div 
          className="text-6xl md:text-8xl font-mono leading-tight tracking-wider transition-colors duration-300"
          style={{ color: textColor }}
        >
          {piDigits.slice(0, currentDigitIndex + 1).split('').map((digit, index) => (
            <span
              key={index}
              className={`inline-block px-2 py-1 mx-1 my-1 transition-opacity ${
                index === currentDigitIndex ? 'opacity-100 scale-110' : 'opacity-40'
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
          onClick={() => setIsPlaying(!isPlaying)}
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
        <div className="fixed top-8 right-8 bg-white text-black p-6 rounded-lg shadow-lg min-w-72">
          <h3 className="text-xl font-bold mb-4">Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tempo: {tempo} BPM ({(tempo/60).toFixed(1)} digits/sec)
              </label>
              <input
                type="range"
                min="60"
                max="240"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>60</span>
                <span>120</span>
                <span>180</span>
                <span>240</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color 1 (Hi-hat background)
                </label>
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color 2 (Kick/Melody background)
                </label>
                <input
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App