import { MembraneSynth, MetalSynth, PolySynth, Reverb, FeedbackDelay, getContext, now, start } from 'tone'

export class AudioEngine {
  private kickSynth: MembraneSynth
  private hihatSynth: MetalSynth
  private melodySynthDark: PolySynth  // For when 0 plays - aggressive sound
  private melodySynthLight: PolySynth // For when 1 plays - bright sound
  private reverb: Reverb
  private delay: FeedbackDelay
  private initialized = false
  private lastTriggerTime = 0
  private currentTheme: 'dark' | 'light' = 'dark'

  constructor() {
    // Don't initialize anything until user interaction
    // Will be initialized in the initialize() method
  }

  private setupRouting() {
    // Connect all synths to effects chain
    this.kickSynth.chain(this.reverb, this.delay).toDestination()
    this.hihatSynth.chain(this.reverb, this.delay).toDestination()
    this.melodySynthDark.chain(this.reverb, this.delay).toDestination()
    this.melodySynthLight.chain(this.reverb, this.delay).toDestination()
  }

  async initialize() {
    if (this.initialized) return
    
    try {
      console.log('Initializing audio engine...')
      
      // Initialize synthesizers AFTER user gesture
      this.kickSynth = new MembraneSynth()
      this.hihatSynth = new MetalSynth()
      // Dark theme synth - aggressive, bassy sound
      this.melodySynthDark = new PolySynth()
      this.melodySynthDark.set({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.6
        }
      })
      
      // Light theme synth - bright, melodic sound  
      this.melodySynthLight = new PolySynth()
      this.melodySynthLight.set({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.08,
          decay: 0.4,
          sustain: 0.7,
          release: 1.0
        }
      })
      
      // Initialize effects
      this.reverb = new Reverb({
        roomSize: 0.2,
        dampening: 3000,
      })
      
      this.delay = new FeedbackDelay({
        delayTime: '16n',
        feedback: 0.2,
      })
      
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
          console.log('Switched to DARK theme (sawtooth)')
          this.kickSynth.triggerAttackRelease('C1', '16n', triggerTime)
          break
          
        case '1':
          // Hi-hat - switches to light theme
          this.currentTheme = 'light'
          console.log('Switched to LIGHT theme (sine)')
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
          console.log(`Playing digit ${digit} with ${synthType} synth`)
          activeSynth.triggerAttackRelease(notes[noteIndex], '8n', triggerTime)
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
    if (this.reverb) this.reverb.dispose()
    if (this.delay) this.delay.dispose()
    this.initialized = false
  }

  // Effect controls
  setReverbRoomSize(size: number) {
    this.reverb.roomSize.value = size
  }

  setReverbWet(wet: number) {
    this.reverb.wet.value = wet
  }

  setDelayTime(time: string) {
    this.delay.delayTime.value = time
  }

  setDelayFeedback(feedback: number) {
    this.delay.feedback.value = feedback
  }

  setDelayWet(wet: number) {
    this.delay.wet.value = wet
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