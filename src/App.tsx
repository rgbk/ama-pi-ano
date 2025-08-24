import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PiGenerator } from './lib/piGenerator'
import { AudioEngine } from './lib/audioEngine'
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
  
  // Pi generator instance
  const piGenerator = useRef(new PiGenerator())
  const initializedRef = useRef(false)
  
  // Audio engine instance
  const audioEngine = useRef(new AudioEngine())
  
  // Generate initial digits
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      // Start with just "3." and generate as needed
      setPiDigits('3.')
    }
  }, [])
  
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
        const newIndex = prev + 1
        // Play audio for the new digit
        const digit = piDigits[newIndex]
        if (digit && digit !== '.') {
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
        <div className="fixed top-8 right-8 bg-white text-black p-6 rounded-lg shadow-lg min-w-72">
          <h3 className="text-xl font-bold mb-4">Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tempo: {tempo} BPM ({(tempo/60).toFixed(1)} digits/sec)
              </label>
              <input
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