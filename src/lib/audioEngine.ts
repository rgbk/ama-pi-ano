import { MembraneSynth, MetalSynth, PolySynth, Synth, Reverb, FeedbackDelay, getContext, now, start } from 'tone'

export class AudioEngine {
  private kickSynth: MembraneSynth
  private hihatSynth: MetalSynth
  private melodySynthDark: Synth  // For when 0 plays - aggressive sound
  private melodySynthLight: Synth // For when 1 plays - bright sound
  private kickReverb: Reverb
  private kickDelay: FeedbackDelay
  private hihatReverb: Reverb
  private hihatDelay: FeedbackDelay
  private darkReverb: Reverb
  private darkDelay: FeedbackDelay
  private lightReverb: Reverb
  private lightDelay: FeedbackDelay
  private initialized = false
  private lastTriggerTime = 0
  private currentTheme: 'dark' | 'light' = 'dark'
  private debugCallback?: (message: string) => void

  constructor() {
    // Don't initialize anything until user interaction
    // Will be initialized in the initialize() method
  }

  private setupRouting() {
    // SIMPLE TEST - just connect melody synths to ONE shared reverb
    const testReverb = new Reverb(2.0)
    testReverb.wet.value = 0.8 // Very wet to hear it clearly
    
    this.kickSynth.toDestination()
    this.hihatSynth.toDestination()
    this.melodySynthDark.connect(testReverb).toDestination()
    this.melodySynthLight.connect(testReverb).toDestination()
    
    console.log('🔌 SIMPLE TEST - melody synths connected to shared reverb')
  }

  async initialize() {
    if (this.initialized) return
    
    try {
      this.debug('🎛️ STARTING AUDIO INITIALIZATION...')
      console.log('Initializing audio engine...')
      
      // Initialize synthesizers AFTER user gesture
      this.kickSynth = new MembraneSynth()
      this.kickSynth.volume.value = -6 // Make sure it's audible
      this.hihatSynth = new MetalSynth()
      this.hihatSynth.volume.value = -6 // Make sure it's audible
      // Dark theme synth - aggressive, bassy sound
      this.melodySynthDark = new Synth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.6
        }
      })
      this.melodySynthDark.volume.value = -6 // Make sure it's audible
      console.log('🎹 Dark melody synth (Synth) created:', this.melodySynthDark)
      
      // Light theme synth - bright, melodic sound  
      this.melodySynthLight = new Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.08,
          decay: 0.4,
          sustain: 0.7,
          release: 1.0
        }
      })
      this.melodySynthLight.volume.value = -6 // Make sure it's audible
      console.log('🎹 Light melody synth (Synth) created:', this.melodySynthLight)
      
      // Initialize separate effects for each synth
      console.log('🎛️ Creating separate effects...')
      
      // Kick effects
      this.kickReverb = new Reverb(2.0) // 2 second decay
      this.kickReverb.wet.value = 0.4
      this.kickDelay = new FeedbackDelay('8n', 0.3) // 8th note delay, 0.3 feedback
      this.kickDelay.wet.value = 0.2
      console.log('🥁 Kick effects created - Reverb wet:', this.kickReverb.wet.value)
      
      // Hi-hat effects
      this.hihatReverb = new Reverb(1.0) // 1 second decay
      this.hihatReverb.wet.value = 0.3
      this.hihatDelay = new FeedbackDelay('16n', 0.15) // 16th note delay, 0.15 feedback
      this.hihatDelay.wet.value = 0.1
      console.log('🎩 Hi-hat effects created - Reverb wet:', this.hihatReverb.wet.value)
      
      // Dark theme melody effects
      this.darkReverb = new Reverb(3.0) // 3 second decay
      this.debug(`🔍 Dark reverb created: ${!!this.darkReverb}`)
      this.debug(`🔍 Dark reverb wet exists: ${!!this.darkReverb.wet}`)
      try {
        this.darkReverb.wet.value = 0.5
        this.debug(`🔍 Dark reverb wet set to: ${this.darkReverb.wet.value}`)
      } catch (e) {
        this.debug(`❌ Dark reverb wet failed: ${e}`)
      }
      
      this.darkDelay = new FeedbackDelay('8n', 0.4) // 8th note delay, 0.4 feedback
      this.debug(`🔍 Dark delay created: ${!!this.darkDelay}`)
      this.debug(`🔍 Dark delay wet exists: ${!!this.darkDelay.wet}`)
      try {
        this.darkDelay.wet.value = 0.3
        this.debug(`🔍 Dark delay wet set to: ${this.darkDelay.wet.value}`)
      } catch (e) {
        this.debug(`❌ Dark delay wet failed: ${e}`)
      }
      
      this.debug(`🌙 Dark effects ready - Rev:${this.darkReverb.wet.value} Del:${this.darkDelay.wet.value}`)
      
      // Light theme melody effects  
      this.lightReverb = new Reverb(1.5) // 1.5 second decay
      this.lightReverb.wet.value = 0.3
      this.lightDelay = new FeedbackDelay('16n', 0.2) // 16th note delay, 0.2 feedback
      this.lightDelay.wet.value = 0.2
      console.log('☀️ Light melody effects created - Reverb wet:', this.lightReverb.wet.value, 'Delay wet:', this.lightDelay.wet.value)
      
      // Setup routing
      this.setupRouting()
      
      // Start Tone.js properly
      console.log('Starting Tone.js...')
      await start()
      console.log('Tone.js started successfully')
      
      this.initialized = true
      console.log('Audio engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
    }
  }

  // Method to switch theme (called from main app)
  setTheme(theme: 'dark' | 'light') {
    this.currentTheme = theme
  }

  // Test method to play melody synth directly
  testMelodySynth() {
    if (!this.initialized) {
      this.debug('❌ Cannot test - audio engine not initialized')
      return
    }
    
    const testSynth = this.currentTheme === 'dark' ? this.melodySynthDark : this.melodySynthLight
    this.debug(`🧪 Testing ${this.currentTheme} melody synth directly...`)
    
    try {
      testSynth.triggerAttackRelease('C4', '2n')
      this.debug('🧪 Test tone triggered - should hear C4 for 2 seconds')
    } catch (error) {
      this.debug(`❌ Test failed: ${error}`)
    }
  }

  // Method to show current effects status
  showEffectsStatus() {
    this.debug(`🔍 Audio initialized: ${this.initialized}`)
    
    if (!this.initialized) {
      this.debug('❌ Effects status: Audio not initialized')
      return
    }
    
    try {
      this.debug('🎛️ EFFECTS STATUS:')
      this.debug(`🔍 Dark reverb exists: ${!!this.darkReverb}`)
      if (this.darkReverb) {
        this.debug(`🔍 Dark reverb properties: ${Object.keys(this.darkReverb).join(', ')}`)
        this.debug(`🔍 Dark reverb wet exists: ${!!this.darkReverb.wet}`)
        this.debug(`🔍 Dark reverb roomSize exists: ${!!this.darkReverb.roomSize}`)
        if (this.darkReverb.wet && this.darkReverb.wet.value !== undefined) {
          this.debug(`🌙 Dark reverb wet: ${this.darkReverb.wet.value}`)
        }
        if (this.darkReverb.decay !== undefined) {
          this.debug(`🌙 Dark reverb decay: ${this.darkReverb.decay}`)
        }
      }
      
      this.debug(`🔍 Dark delay exists: ${!!this.darkDelay}`)
      if (this.darkDelay) {
        this.debug(`🌙 Dark delay wet: ${this.darkDelay.wet.value}, feedback: ${this.darkDelay.feedback.value}`)
      }
      
      this.debug(`🔍 Light reverb exists: ${!!this.lightReverb}`)
      if (this.lightReverb) {
        this.debug(`☀️ Light reverb wet: ${this.lightReverb.wet.value}, room: ${this.lightReverb.roomSize.value}`)
      }
      
      this.debug(`🔍 Light delay exists: ${!!this.lightDelay}`)
      if (this.lightDelay) {
        this.debug(`☀️ Light delay wet: ${this.lightDelay.wet.value}, feedback: ${this.lightDelay.feedback.value}`)
      }
      
      this.debug(`🎵 Current theme: ${this.currentTheme}`)
    } catch (error) {
      this.debug(`❌ Effects status failed: ${error}`)
    }
  }

  // Set debug callback
  setDebugCallback(callback: (message: string) => void) {
    this.debugCallback = callback
  }

  private debug(message: string) {
    console.log(message)
    if (this.debugCallback) {
      this.debugCallback(message)
    }
  }

  playDigit(digit: string) {
    if (!this.initialized) {
      return // Don't try to initialize here, too expensive
    }

    try {
      // Prevent rapid-fire triggering
      const currentTime = now()
      if (currentTime - this.lastTriggerTime < 0.05) { // 50ms minimum between notes
        return
      }
      this.lastTriggerTime = currentTime

      // Use Tone.js 'now()' for better timing
      const triggerTime = now() + 0.01

      switch (digit) {
        case '0':
          // Kick drum - switches to dark theme
          this.currentTheme = 'dark'
          this.debug('🥁 Digit 0: KICK + switched to DARK theme (sawtooth)')
          this.kickSynth.triggerAttackRelease('C1', '16n', triggerTime)
          break
          
        case '1':
          // Hi-hat - switches to light theme
          this.currentTheme = 'light'
          this.debug('🎩 Digit 1: HI-HAT + switched to LIGHT theme (sine)')
          this.hihatSynth.triggerAttackRelease('G5', '32n', triggerTime)
          break
          
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Melody notes - use current theme synth
          const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
          const noteIndex = parseInt(digit) - 2
          const activeSynth = this.currentTheme === 'dark' ? this.melodySynthDark : this.melodySynthLight
          const synthType = this.currentTheme === 'dark' ? 'DARK(sawtooth)' : 'LIGHT(sine)'
          const note = notes[noteIndex]
          
          if (!activeSynth) {
            this.debug(`❌ Digit ${digit}: Active synth is UNDEFINED! (theme: ${this.currentTheme})`)
            break
          }
          
          try {
            activeSynth.triggerAttackRelease(note, '8n', triggerTime)
            // Only log melody notes, not the detailed synth info
            this.debug(`🎼 ${digit}=${note} (${synthType})`)
          } catch (synthError) {
            this.debug(`❌ Digit ${digit}: Failed - ${synthError}`)
          }
          break
      }
    } catch (error) {
      console.error('Error playing digit:', digit, error)
    }
  }

  // Clean disposal method
  dispose() {
    if (this.kickSynth) this.kickSynth.dispose()
    if (this.hihatSynth) this.hihatSynth.dispose()  
    if (this.melodySynthDark) this.melodySynthDark.dispose()
    if (this.melodySynthLight) this.melodySynthLight.dispose()
    if (this.kickReverb) this.kickReverb.dispose()
    if (this.kickDelay) this.kickDelay.dispose()
    if (this.hihatReverb) this.hihatReverb.dispose()
    if (this.hihatDelay) this.hihatDelay.dispose()
    if (this.darkReverb) this.darkReverb.dispose()
    if (this.darkDelay) this.darkDelay.dispose()
    if (this.lightReverb) this.lightReverb.dispose()
    if (this.lightDelay) this.lightDelay.dispose()
    this.initialized = false
  }

  // Dark theme effect controls  
  setDarkReverbDecay(decay: number) {
    if (!this.initialized) {
      this.debug('❌ Dark reverb decay: Audio not initialized')
      return
    }
    this.darkReverb.decay = decay
    this.debug(`🌙 Dark reverb decay set to: ${decay}`)
  }

  setDarkReverbWet(wet: number) {
    if (!this.initialized) {
      this.debug('❌ Dark reverb wet: Audio not initialized')
      return
    }
    this.darkReverb.wet.value = wet
    this.debug(`🌙 Dark reverb wet set to: ${wet}`)
  }

  setDarkDelayTime(time: string) {
    if (!this.initialized) {
      this.debug('❌ Dark delay time: Audio not initialized')
      return
    }
    this.darkDelay.delayTime.value = time
    this.debug(`🌙 Dark delay time set to: ${time}`)
  }

  setDarkDelayFeedback(feedback: number) {
    if (!this.initialized) {
      this.debug('❌ Dark delay feedback: Audio not initialized')
      return
    }
    this.darkDelay.feedback.value = feedback
    this.debug(`🌙 Dark delay feedback set to: ${feedback}`)
  }

  setDarkDelayWet(wet: number) {
    if (!this.initialized) {
      this.debug('❌ Dark delay wet: Audio not initialized')
      return
    }
    this.darkDelay.wet.value = wet
    this.debug(`🌙 Dark delay wet set to: ${wet}`)
  }

  // Light theme effect controls
  setLightReverbRoomSize(size: number) {
    if (!this.initialized) {
      this.debug('❌ Light reverb room: Audio not initialized')
      return
    }
    this.lightReverb.roomSize.value = size
    this.debug(`☀️ Light reverb room size set to: ${size}`)
  }

  setLightReverbWet(wet: number) {
    if (!this.initialized) {
      this.debug('❌ Light reverb wet: Audio not initialized')
      return
    }
    this.lightReverb.wet.value = wet
    this.debug(`☀️ Light reverb wet set to: ${wet}`)
  }

  setLightDelayTime(time: string) {
    if (!this.initialized) {
      this.debug('❌ Light delay time: Audio not initialized')
      return
    }
    this.lightDelay.delayTime.value = time
    this.debug(`☀️ Light delay time set to: ${time}`)
  }

  setLightDelayFeedback(feedback: number) {
    if (!this.initialized) {
      this.debug('❌ Light delay feedback: Audio not initialized')
      return
    }
    this.lightDelay.feedback.value = feedback
    this.debug(`☀️ Light delay feedback set to: ${feedback}`)
  }

  setLightDelayWet(wet: number) {
    if (!this.initialized) {
      this.debug('❌ Light delay wet: Audio not initialized')
      return
    }
    this.lightDelay.wet.value = wet
    this.debug(`☀️ Light delay wet set to: ${wet}`)
  }

  // Kick effect controls
  setKickReverbRoomSize(size: number) {
    this.kickReverb.roomSize.value = size
  }

  setKickReverbWet(wet: number) {
    this.kickReverb.wet.value = wet
  }

  setKickDelayTime(time: string) {
    this.kickDelay.delayTime.value = time
  }

  setKickDelayFeedback(feedback: number) {
    this.kickDelay.feedback.value = feedback
  }

  setKickDelayWet(wet: number) {
    this.kickDelay.wet.value = wet
  }

  // Hi-hat effect controls
  setHihatReverbRoomSize(size: number) {
    this.hihatReverb.roomSize.value = size
  }

  setHihatReverbWet(wet: number) {
    this.hihatReverb.wet.value = wet
  }

  setHihatDelayTime(time: string) {
    this.hihatDelay.delayTime.value = time
  }

  setHihatDelayFeedback(feedback: number) {
    this.hihatDelay.feedback.value = feedback
  }

  setHihatDelayWet(wet: number) {
    this.hihatDelay.wet.value = wet
  }

  // Synth controls
  setKickPitchDecay(decay: number) {
    this.kickSynth.pitchDecay = decay
  }

  setKickOctaves(octaves: number) {
    this.kickSynth.octaves = octaves
  }

  setHihatResonance(resonance: number) {
    this.hihatSynth.resonance = resonance
  }

  setHihatFrequency(frequency: number) {
    this.hihatSynth.frequency.value = frequency
  }
}