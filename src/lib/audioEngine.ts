import { MembraneSynth, MetalSynth, PolySynth, Synth, getContext, now, start } from 'tone'
import { MusicTheoryEngine } from './musicTheory'

export class AudioEngine {
  private kickSynth!: MembraneSynth
  private hihatSynth!: MetalSynth
  private melodySynthDark!: PolySynth<Synth>  // For when 0 plays - aggressive sound
  private melodySynthLight!: PolySynth<Synth> // For when 1 plays - bright sound
  // Dark theme reverb (kick + dark melody)
  private darkReverbNode!: ConvolverNode
  private darkReverbGain!: GainNode
  private darkReverbFilter!: BiquadFilterNode
  private darkEarlyReflections!: ConvolverNode
  private darkLateReflections!: ConvolverNode
  private darkEarlyGain!: GainNode
  private darkLateGain!: GainNode
  private darkPreDelayNode!: DelayNode
  private darkStereoWidener!: StereoPannerNode
  
  // Light theme reverb (hihat + light melody)  
  private lightReverbNode!: ConvolverNode
  private lightReverbGain!: GainNode
  private lightReverbFilter!: BiquadFilterNode
  private lightEarlyReflections!: ConvolverNode
  private lightLateReflections!: ConvolverNode
  private lightEarlyGain!: GainNode
  private lightLateGain!: GainNode
  private lightPreDelayNode!: DelayNode
  private lightStereoWidener!: StereoPannerNode
  public initialized = false
  private lastTriggerTime = 0
  private currentTheme: 'dark' | 'light' = 'dark'
  private debugCallback?: (message: string) => void
  
  // Music theory engine for scale/chord calculations
  private musicTheory: MusicTheoryEngine

  constructor() {
    // Initialize music theory engine
    this.musicTheory = new MusicTheoryEngine()
    // Don't initialize audio until user interaction
    // Will be initialized in the initialize() method
  }

  private createAdvancedReverbImpulse(
    decayTime: number,
    damping: number,
    _earlyReflectionRatio: number
  ) {
    const audioContext = getContext().rawContext as AudioContext
    const sampleRate = audioContext.sampleRate
    const length = sampleRate * decayTime
    
    // Create full reverb impulse
    const fullImpulse = audioContext.createBuffer(2, length, sampleRate)
    
    // Create early reflections (first 20% of impulse)
    const earlyLength = Math.floor(length * 0.2)
    const earlyImpulse = audioContext.createBuffer(2, earlyLength, sampleRate)
    
    // Create late reflections (remaining 80%)  
    const lateLength = length - earlyLength
    const lateImpulse = audioContext.createBuffer(2, lateLength, sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const fullData = fullImpulse.getChannelData(channel)
      const earlyData = earlyImpulse.getChannelData(channel)
      const lateData = lateImpulse.getChannelData(channel)
      
      // Generate full impulse with damping
      for (let i = 0; i < length; i++) {
        const t = i / length
        const decay = Math.pow(1 - t, 2)
        
        // Apply damping (high-frequency rolloff)
        const dampingFactor = damping > 0 ? Math.exp(-t * damping / 1000) : 1
        
        const sample = (Math.random() * 2 - 1) * decay * dampingFactor
        fullData[i] = sample
        
        // Split into early/late
        if (i < earlyLength) {
          earlyData[i] = sample
        } else {
          lateData[i - earlyLength] = sample
        }
      }
    }
    
    return { fullImpulse, earlyImpulse, lateImpulse }
  }
  
  private createThemeReverbs() {
    const audioContext = getContext().rawContext as AudioContext
    
    // DARK THEME REVERB (more dramatic)
    this.darkReverbNode = audioContext.createConvolver()
    this.darkReverbGain = audioContext.createGain()
    this.darkReverbFilter = audioContext.createBiquadFilter()
    this.darkEarlyReflections = audioContext.createConvolver()
    this.darkLateReflections = audioContext.createConvolver()
    this.darkEarlyGain = audioContext.createGain()
    this.darkLateGain = audioContext.createGain()
    this.darkPreDelayNode = audioContext.createDelay(0.2)
    this.darkStereoWidener = audioContext.createStereoPanner()
    
    // Dark defaults (more dramatic)
    this.darkReverbGain.gain.value = 0.5 // 50% wet
    this.darkReverbFilter.type = 'lowpass'
    this.darkReverbFilter.frequency.value = 4000 // 4kHz damping
    this.darkEarlyGain.gain.value = 0.5 // 50% early/late balance
    this.darkLateGain.gain.value = 0.5
    this.darkPreDelayNode.delayTime.value = 0.0 // 0ms pre-delay
    this.darkStereoWidener.pan.value = 0 // center (100% width)
    
    // LIGHT THEME REVERB (more subtle)
    this.lightReverbNode = audioContext.createConvolver()
    this.lightReverbGain = audioContext.createGain()
    this.lightReverbFilter = audioContext.createBiquadFilter()
    this.lightEarlyReflections = audioContext.createConvolver()
    this.lightLateReflections = audioContext.createConvolver()
    this.lightEarlyGain = audioContext.createGain()
    this.lightLateGain = audioContext.createGain()
    this.lightPreDelayNode = audioContext.createDelay(0.2)
    this.lightStereoWidener = audioContext.createStereoPanner()
    
    // Light defaults (more subtle)
    this.lightReverbGain.gain.value = 0.3 // 30% wet
    this.lightReverbFilter.type = 'lowpass'
    this.lightReverbFilter.frequency.value = 6000 // 6kHz damping (brighter)
    this.lightEarlyGain.gain.value = 0.5 // 50% early/late balance
    this.lightLateGain.gain.value = 0.5
    this.lightPreDelayNode.delayTime.value = 0.0 // 0ms pre-delay
    this.lightStereoWidener.pan.value = 0 // center (100% width)
    
    // Generate impulse responses
    const darkImpulses = this.createAdvancedReverbImpulse(3.0, 2000, 0.5) // 3s decay, 2kHz damping
    const lightImpulses = this.createAdvancedReverbImpulse(1.5, 4000, 0.5) // 1.5s decay, 4kHz damping
    
    this.darkReverbNode.buffer = darkImpulses.fullImpulse
    this.darkEarlyReflections.buffer = darkImpulses.earlyImpulse
    this.darkLateReflections.buffer = darkImpulses.lateImpulse
    
    this.lightReverbNode.buffer = lightImpulses.fullImpulse
    this.lightEarlyReflections.buffer = lightImpulses.earlyImpulse  
    this.lightLateReflections.buffer = lightImpulses.lateImpulse
    
    this.debug('🎛️ Advanced dark/light reverbs created')
  }

  private setupAdvancedRouting() {
    const audioContext = getContext().rawContext as AudioContext
    this.debug('🔌 Setting up advanced reverb routing...')
    
    // DARK THEME ROUTING (kick + dark melody)
    // Pre-delay -> Early/Late -> Filter -> Stereo -> Gain -> Destination
    this.darkPreDelayNode.connect(this.darkEarlyReflections)
    this.darkPreDelayNode.connect(this.darkLateReflections)
    
    this.darkEarlyReflections.connect(this.darkEarlyGain)
    this.darkLateReflections.connect(this.darkLateGain)
    
    this.darkEarlyGain.connect(this.darkReverbFilter)
    this.darkLateGain.connect(this.darkReverbFilter)
    
    this.darkReverbFilter.connect(this.darkStereoWidener)
    this.darkStereoWidener.connect(this.darkReverbGain)
    this.darkReverbGain.connect(audioContext.destination)
    
    // LIGHT THEME ROUTING (hihat + light melody)
    this.lightPreDelayNode.connect(this.lightEarlyReflections)
    this.lightPreDelayNode.connect(this.lightLateReflections)
    
    this.lightEarlyReflections.connect(this.lightEarlyGain)
    this.lightLateReflections.connect(this.lightLateGain)
    
    this.lightEarlyGain.connect(this.lightReverbFilter)
    this.lightLateGain.connect(this.lightReverbFilter)
    
    this.lightReverbFilter.connect(this.lightStereoWidener)
    this.lightStereoWidener.connect(this.lightReverbGain)
    this.lightReverbGain.connect(audioContext.destination)
    
    // Connect synths to their respective theme reverbs
    this.kickSynth.connect(this.darkPreDelayNode) // Kick uses dark reverb
    this.melodySynthDark.connect(this.darkPreDelayNode) // Dark melody uses dark reverb
    
    this.hihatSynth.connect(this.lightPreDelayNode) // Hihat uses light reverb  
    this.melodySynthLight.connect(this.lightPreDelayNode) // Light melody uses light reverb
    
    // Also connect dry signals directly
    this.kickSynth.toDestination()
    this.hihatSynth.toDestination()
    this.melodySynthDark.toDestination()
    this.melodySynthLight.toDestination()
    
    this.debug('🔌 Advanced reverb routing complete!')
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
      this.melodySynthDark = new PolySynth(Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.6
        }
      })
      this.melodySynthDark.volume.value = -6 // Balanced with kick/hihat
      console.log('🎹 Dark melody synth (PolySynth) created:', this.melodySynthDark)
      this.debug(`🔍 Dark PolySynth volume: ${this.melodySynthDark.volume.value}dB`)
      this.debug(`🔍 Dark PolySynth state: ${(this.melodySynthDark as any).state}`)
      
      // Light theme synth - bright, melodic sound  
      this.melodySynthLight = new PolySynth(Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.08,
          decay: 0.4,
          sustain: 0.7,
          release: 1.0
        }
      })
      this.melodySynthLight.volume.value = -6 // Balanced with kick/hihat
      console.log('🎹 Light melody synth (PolySynth) created:', this.melodySynthLight)
      this.debug(`🔍 Light PolySynth volume: ${this.melodySynthLight.volume.value}dB`)
      this.debug(`🔍 Light PolySynth state: ${(this.melodySynthLight as any).state}`)
      
      // Create advanced theme-based reverbs
      console.log('🎛️ Creating advanced theme reverbs...')
      this.createThemeReverbs()
      console.log('🎛️ Advanced theme reverbs created')
      
      
      // Setup advanced routing  
      this.setupAdvancedRouting()
      
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
    this.debug(`🔍 Synth volume: ${testSynth.volume.value}dB`)
    this.debug(`🔍 Synth state: ${(testSynth as any).state}`)
    
    try {
      testSynth.triggerAttackRelease('C4', '2n')
      this.debug('🧪 Test tone triggered - should hear LOUD C4 for 2 seconds')
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
      this.debug('🎛️ ADVANCED REVERB STATUS:')
      this.debug(`🔍 Dark reverb exists: ${!!this.darkReverbGain}`)
      this.debug(`🔍 Light reverb exists: ${!!this.lightReverbGain}`)
      if (this.darkReverbGain) {
        this.debug(`🌙 Dark reverb mix: ${this.darkReverbGain.gain.value}`)
      }
      if (this.lightReverbGain) {
        this.debug(`☀️ Light reverb mix: ${this.lightReverbGain.gain.value}`)
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
          // Melody notes - use music theory engine to determine chord/note
          const digitNum = parseInt(digit)
          const chordNotes = this.musicTheory.digitToChordNotes(digitNum, 4) // Use 4th octave
          const activeSynth = this.currentTheme === 'dark' ? this.melodySynthDark : this.melodySynthLight
          const synthType = this.currentTheme === 'dark' ? 'DARK(sawtooth)' : 'LIGHT(sine)'
          
          if (!chordNotes || chordNotes.length === 0) {
            this.debug(`❌ Digit ${digit}: Could not map to notes (invalid digit)`)
            break
          }
          
          if (!activeSynth) {
            this.debug(`❌ Digit ${digit}: Active synth is UNDEFINED! (theme: ${this.currentTheme})`)
            break
          }
          
          try {
            const isChord = chordNotes.length > 1
            const noteDisplay = isChord ? `[${chordNotes.join(', ')}]` : chordNotes[0]
            
            this.debug(`🔍 About to play: ${noteDisplay} on ${synthType}`)
            this.debug(`🔍 Scale degree: ${this.musicTheory.digitToScaleDegree(digitNum)}`)
            this.debug(`🔍 Current settings: ${this.musicTheory.getCurrentSettings().key} ${this.musicTheory.getCurrentSettings().mode} ${this.musicTheory.getCurrentSettings().chord}`)
            this.debug(`🔍 Chord type: ${isChord ? 'CHORD' : 'SINGLE'} (${chordNotes.length} notes)`)
            this.debug(`🔍 Synth volume: ${activeSynth.volume.value}dB`)
            
            // Calculate volume scaling based on number of notes to prevent clipping
            const noteCount = chordNotes.length
            const baseVolume = -6 // Our standard base volume
            const scaledVolume = this.calculatePolyphonicVolume(baseVolume, noteCount)
            
            // Temporarily adjust synth volume for this chord
            const originalVolume = activeSynth.volume.value
            activeSynth.volume.rampTo(scaledVolume, 0.01, triggerTime) // Quick ramp to new volume
            
            this.debug(`🔊 Volume scaling: ${noteCount} notes → ${scaledVolume.toFixed(1)}dB (was ${originalVolume}dB)`)
            
            // Play either single note or chord
            if (isChord) {
              // PolySynth can handle arrays of notes for chords
              activeSynth.triggerAttackRelease(chordNotes, '8n', triggerTime)
            } else {
              // Single note
              activeSynth.triggerAttackRelease(chordNotes[0], '8n', triggerTime)
            }
            
            // Restore original volume after the note duration
            activeSynth.volume.rampTo(originalVolume, 0.1, triggerTime + 0.5) // Restore after 500ms
            
            this.debug(`🎼 ${digit}=${noteDisplay} (${synthType}) - TRIGGERED`)
            
            // Check if synth is making sound by checking active voices
            setTimeout(() => {
              if (activeSynth.activeVoices && activeSynth.activeVoices > 0) {
                this.debug(`✅ Active voices: ${activeSynth.activeVoices}`)
              } else {
                this.debug(`⚠️ No active voices detected - sound may not be playing`)
              }
            }, 50)
            
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
    // Disconnect dark reverb chain
    if (this.darkReverbNode) this.darkReverbNode.disconnect()
    if (this.darkReverbGain) this.darkReverbGain.disconnect()
    if (this.darkReverbFilter) this.darkReverbFilter.disconnect()
    if (this.darkEarlyReflections) this.darkEarlyReflections.disconnect()
    if (this.darkLateReflections) this.darkLateReflections.disconnect()
    if (this.darkEarlyGain) this.darkEarlyGain.disconnect()
    if (this.darkLateGain) this.darkLateGain.disconnect()
    if (this.darkPreDelayNode) this.darkPreDelayNode.disconnect()
    if (this.darkStereoWidener) this.darkStereoWidener.disconnect()
    
    // Disconnect light reverb chain
    if (this.lightReverbNode) this.lightReverbNode.disconnect()
    if (this.lightReverbGain) this.lightReverbGain.disconnect()
    if (this.lightReverbFilter) this.lightReverbFilter.disconnect()
    if (this.lightEarlyReflections) this.lightEarlyReflections.disconnect()
    if (this.lightLateReflections) this.lightLateReflections.disconnect()
    if (this.lightEarlyGain) this.lightEarlyGain.disconnect()
    if (this.lightLateGain) this.lightLateGain.disconnect()
    if (this.lightPreDelayNode) this.lightPreDelayNode.disconnect()
    if (this.lightStereoWidener) this.lightStereoWidener.disconnect()
    this.initialized = false
  }

  // DARK THEME REVERB CONTROLS (7 parameters)
  setDarkReverbDecay(decay: number) {
    if (!this.initialized) return
    // Regenerate impulse with new decay time
    const impulses = this.createAdvancedReverbImpulse(decay, 2000, 0.5)
    this.darkReverbNode.buffer = impulses.fullImpulse
    this.darkEarlyReflections.buffer = impulses.earlyImpulse
    this.darkLateReflections.buffer = impulses.lateImpulse
    this.debug(`🌙 Dark decay: ${decay}s`)
  }

  setDarkReverbWet(wet: number) {
    if (!this.initialized) return
    this.darkReverbGain.gain.value = wet / 100 // Convert 0-100 to 0-1
    this.debug(`🌙 Dark wet: ${wet}%`)
  }

  setDarkReverbPreDelay(preDelay: number) {
    if (!this.initialized) return
    this.darkPreDelayNode.delayTime.value = preDelay / 1000 // Convert ms to seconds
    this.debug(`🌙 Dark pre-delay: ${preDelay}ms`)
  }

  setDarkReverbRoomSize(roomSize: number) {
    if (!this.initialized) return
    // Regenerate impulse with new room size (affects decay time)
    const impulses = this.createAdvancedReverbImpulse(roomSize, 2000, 0.5)
    this.darkReverbNode.buffer = impulses.fullImpulse
    this.darkEarlyReflections.buffer = impulses.earlyImpulse
    this.darkLateReflections.buffer = impulses.lateImpulse
    this.debug(`🌙 Dark room size: ${roomSize}`)
  }

  setDarkReverbDamping(damping: number) {
    if (!this.initialized) return
    this.darkReverbFilter.frequency.value = damping
    this.debug(`🌙 Dark damping: ${damping}Hz`)
  }

  setDarkReverbEarlyLateBalance(balance: number) {
    if (!this.initialized) return
    const early = balance / 100 // 0-1
    const late = 1 - early
    this.darkEarlyGain.gain.value = early
    this.darkLateGain.gain.value = late
    this.debug(`🌙 Dark early/late: ${balance}%`)
  }

  setDarkReverbStereoWidth(width: number) {
    if (!this.initialized) return
    // Convert 0-200% to stereo panner range
    const panValue = (width - 100) / 100 // 0%=−1, 100%=0, 200%=1
    this.darkStereoWidener.pan.value = Math.max(-1, Math.min(1, panValue))
    this.debug(`🌙 Dark width: ${width}%`)
  }

  // LIGHT THEME REVERB CONTROLS (7 parameters)  
  setLightReverbDecay(decay: number) {
    if (!this.initialized) return
    const impulses = this.createAdvancedReverbImpulse(decay, 4000, 0.5)
    this.lightReverbNode.buffer = impulses.fullImpulse
    this.lightEarlyReflections.buffer = impulses.earlyImpulse
    this.lightLateReflections.buffer = impulses.lateImpulse
    this.debug(`☀️ Light decay: ${decay}s`)
  }

  setLightReverbWet(wet: number) {
    if (!this.initialized) return
    this.lightReverbGain.gain.value = wet / 100
    this.debug(`☀️ Light wet: ${wet}%`)
  }

  setLightReverbPreDelay(preDelay: number) {
    if (!this.initialized) return
    this.lightPreDelayNode.delayTime.value = preDelay / 1000
    this.debug(`☀️ Light pre-delay: ${preDelay}ms`)
  }

  setLightReverbRoomSize(roomSize: number) {
    if (!this.initialized) return
    // Regenerate impulse with new room size (affects decay time)
    const impulses = this.createAdvancedReverbImpulse(roomSize, 4000, 0.5)
    this.lightReverbNode.buffer = impulses.fullImpulse
    this.lightEarlyReflections.buffer = impulses.earlyImpulse
    this.lightLateReflections.buffer = impulses.lateImpulse
    this.debug(`☀️ Light room size: ${roomSize}`)
  }

  setLightReverbDamping(damping: number) {
    if (!this.initialized) return
    this.lightReverbFilter.frequency.value = damping
    this.debug(`☀️ Light damping: ${damping}Hz`)
  }

  setLightReverbEarlyLateBalance(balance: number) {
    if (!this.initialized) return
    const early = balance / 100
    const late = 1 - early
    this.lightEarlyGain.gain.value = early
    this.lightLateGain.gain.value = late
    this.debug(`☀️ Light early/late: ${balance}%`)
  }

  setLightReverbStereoWidth(width: number) {
    if (!this.initialized) return
    const panValue = (width - 100) / 100
    this.lightStereoWidener.pan.value = Math.max(-1, Math.min(1, panValue))
    this.debug(`☀️ Light width: ${width}%`)
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

  // Dark synth envelope controls
  setDarkSynthEnvelope(envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }) {
    if (!this.initialized || !this.melodySynthDark) return
    this.melodySynthDark.set({ envelope })
    this.debug(`🌙 Dark synth envelope updated`)
  }

  // Dark synth oscillator controls
  setDarkSynthOscillator(oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle'
    partialCount?: number
  }) {
    if (!this.initialized || !this.melodySynthDark) return
    this.melodySynthDark.set({ oscillator })
    this.debug(`🌙 Dark synth oscillator: ${oscillator.type}`)
  }

  // Light synth envelope controls
  setLightSynthEnvelope(envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }) {
    if (!this.initialized || !this.melodySynthLight) return
    this.melodySynthLight.set({ envelope })
    this.debug(`☀️ Light synth envelope updated`)
  }

  // Light synth oscillator controls
  setLightSynthOscillator(oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle'
    partialCount?: number
  }) {
    if (!this.initialized || !this.melodySynthLight) return
    this.melodySynthLight.set({ oscillator })
    this.debug(`☀️ Light synth oscillator: ${oscillator.type}`)
  }

  // Dark synth portamento control
  setDarkSynthPortamento(portamento: number) {
    if (!this.initialized || !this.melodySynthDark) return
    this.melodySynthDark.set({ portamento })
    this.debug(`🌙 Dark synth portamento: ${portamento}s`)
  }

  // Dark synth detune control
  setDarkSynthDetune(detune: number) {
    if (!this.initialized || !this.melodySynthDark) return
    this.melodySynthDark.set({ detune })
    this.debug(`🌙 Dark synth detune: ${detune} cents`)
  }

  // Light synth portamento control
  setLightSynthPortamento(portamento: number) {
    if (!this.initialized || !this.melodySynthLight) return
    this.melodySynthLight.set({ portamento })
    this.debug(`☀️ Light synth portamento: ${portamento}s`)
  }

  // Light synth detune control
  setLightSynthDetune(detune: number) {
    if (!this.initialized || !this.melodySynthLight) return
    this.melodySynthLight.set({ detune })
    this.debug(`☀️ Light synth detune: ${detune} cents`)
  }
  
  // Music theory controls
  setMusicalKey(key: string) {
    try {
      this.musicTheory.setKey(key)
      this.debug(`🎵 Key changed to: ${key}`)
      this.debug(`🎵 New scale notes: ${this.musicTheory.getCurrentScaleNotes().join(', ')}`)
    } catch (error) {
      this.debug(`❌ Invalid key: ${key} - ${error}`)
    }
  }
  
  setMusicalMode(mode: string) {
    try {
      this.musicTheory.setMode(mode as any) // Type assertion needed due to string input
      const settings = this.musicTheory.getCurrentSettings()
      this.debug(`🎵 Mode changed to: ${mode} (${settings.modeCharacter})`)
      this.debug(`🎵 New scale notes: ${settings.scaleNotes.join(', ')}`)
    } catch (error) {
      this.debug(`❌ Invalid mode: ${mode} - ${error}`)
    }
  }
  
  setMusicalScale(scale: string) {
    this.musicTheory.setScale(scale)
    this.debug(`🎵 Scale type changed to: ${scale}`)
  }
  
  setMusicalChord(chord: string) {
    this.musicTheory.setChord(chord)
    this.debug(`🎵 Chord type changed to: ${chord}`)
  }
  
  // Get current music theory settings
  getMusicTheorySettings() {
    return this.musicTheory.getCurrentSettings()
  }
  
  // Calculate volume scaling for polyphonic playback
  private calculatePolyphonicVolume(baseVolume: number, noteCount: number): number {
    if (noteCount <= 1) {
      return baseVolume // No scaling needed for single notes
    }
    
    // Logarithmic volume scaling - more musical than linear
    // Each additional note reduces volume by ~3dB (half the perceived loudness)
    const volumeReduction = Math.log2(noteCount) * 3
    const scaledVolume = baseVolume - volumeReduction
    
    // Ensure we don't go below -30dB (too quiet) or above 0dB (clipping)
    return Math.max(-30, Math.min(0, scaledVolume))
  }
  
  // Test the music theory mapping
  testMusicTheoryMapping() {
    if (!this.initialized) {
      this.debug('❌ Cannot test - audio engine not initialized')
      return
    }
    
    this.debug('🎵 Testing music theory mapping:')
    this.musicTheory.testDigitMapping()
    
    // Test playing each chord/note
    const activeSynth = this.currentTheme === 'dark' ? this.melodySynthDark : this.melodySynthLight
    const settings = this.musicTheory.getCurrentSettings()
    this.debug(`🎵 Playing ${settings.chord} progression (digits 2-9):`)
    
    for (let digit = 2; digit <= 9; digit++) {
      const chordNotes = this.musicTheory.digitToChordNotes(digit, 4)
      if (chordNotes && chordNotes.length > 0) {
        const isChord = chordNotes.length > 1
        const noteDisplay = isChord ? `[${chordNotes.join(', ')}]` : chordNotes[0]
        
        setTimeout(() => {
          // Apply volume scaling for test too
          const noteCount = chordNotes.length
          const scaledVolume = this.calculatePolyphonicVolume(-6, noteCount)
          const originalVolume = activeSynth.volume.value
          
          activeSynth.volume.rampTo(scaledVolume, 0.01)
          
          if (isChord) {
            activeSynth.triggerAttackRelease(chordNotes, '4n')
          } else {
            activeSynth.triggerAttackRelease(chordNotes[0], '4n')
          }
          
          // Restore volume
          setTimeout(() => activeSynth.volume.rampTo(originalVolume, 0.1), 500)
          
          this.debug(`🎵 ${digit} → ${noteDisplay} (vol: ${scaledVolume.toFixed(1)}dB)`)
        }, (digit - 2) * 500) // 500ms between chords (longer for chords)
      }
    }
  }
}