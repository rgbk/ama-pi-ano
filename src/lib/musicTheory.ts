import { Scale, Note } from 'tonal'

// Musical modes with their interval patterns (8 notes including octave)
export const MODES = {
  ionian: {
    intervals: [0, 2, 4, 5, 7, 9, 11, 12],  // Major
    character: "bright, happy, major"
  },
  dorian: {
    intervals: [0, 2, 3, 5, 7, 9, 10, 12],  // Jazz/modal
    character: "bittersweet, jazzy, contemplative"
  },
  phrygian: {
    intervals: [0, 1, 3, 5, 7, 8, 10, 12],  // Spanish
    character: "dark, exotic, Spanish"
  },
  lydian: {
    intervals: [0, 2, 4, 6, 7, 9, 11, 12],  // Dreamy
    character: "ethereal, dreamy, floating"
  },
  mixolydian: {
    intervals: [0, 2, 4, 5, 7, 9, 10, 12],  // Blues/rock
    character: "bluesy, groovy, dominant"
  },
  aeolian: {
    intervals: [0, 2, 3, 5, 7, 8, 10, 12],  // Natural minor
    character: "sad, natural minor, melancholic"
  },
  locrian: {
    intervals: [0, 1, 3, 5, 6, 8, 10, 12],  // Diminished
    character: "unstable, diminished, tense"
  },
  harmonic: {
    intervals: [0, 2, 3, 5, 7, 8, 11, 12],  // Harmonic minor
    character: "mysterious, classical, Middle Eastern"
  }
} as const

export type ModeType = keyof typeof MODES

// Basic chord structures
export const CHORD_LIBRARY = {
  triads: {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8]
  },
  seventh: {
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    m7b5: [0, 3, 6, 10]
  },
  extended: {
    maj9: [0, 4, 7, 11, 14],
    m9: [0, 3, 7, 10, 14],
    dom9: [0, 4, 7, 10, 14]
  }
} as const

export class MusicTheoryEngine {
  private currentKey: string = 'C'
  private currentMode: ModeType = 'ionian'
  private currentScale: string = 'major'
  private currentChord: string = 'triads'

  constructor() {
    // Initialize with default values
  }

  // Convert digit (2-9) to scale degree (0-7)
  digitToScaleDegree(digit: number): number | null {
    if (digit < 2 || digit > 9) return null
    return digit - 2  // 2->0, 3->1, 4->2, ..., 9->7
  }

  // Get the current scale notes based on key and mode
  getCurrentScaleNotes(): string[] {
    const intervals = MODES[this.currentMode].intervals
    
    try {
      // Use Tonal.js to generate scale
      const scaleName = this.modeToScaleName(this.currentMode)
      const scale = Scale.get(`${this.currentKey} ${scaleName}`)
      
      if (scale.notes.length === 0) {
        // Fallback to manual calculation if Tonal.js doesn't recognize the scale
        return this.generateScaleManually(intervals)
      }
      
      // Extend to 8 notes (including octave)
      const extendedScale = [...scale.notes]
      if (extendedScale.length < 8) {
        // Add octave
        const octaveNote = Note.transpose(extendedScale[0], '8P') // Perfect octave
        extendedScale.push(octaveNote)
      }
      
      return extendedScale.slice(0, 8) // Ensure exactly 8 notes
    } catch (error) {
      console.warn('Error generating scale with Tonal.js, using manual calculation:', error)
      return this.generateScaleManually(intervals)
    }
  }

  // Convert mode name to Tonal.js scale name
  private modeToScaleName(mode: ModeType): string {
    const modeMap: Record<ModeType, string> = {
      ionian: 'major',
      dorian: 'dorian',
      phrygian: 'phrygian',
      lydian: 'lydian',
      mixolydian: 'mixolydian',
      aeolian: 'minor',
      locrian: 'locrian',
      harmonic: 'harmonic minor'
    }
    return modeMap[mode]
  }

  // Manual scale generation as fallback
  private generateScaleManually(intervals: readonly number[]): string[] {
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const rootIndex = chromatic.indexOf(this.currentKey)
    
    if (rootIndex === -1) {
      console.error(`Invalid key: ${this.currentKey}`)
      return ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] // Fallback to C major
    }
    
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12
      return chromatic[noteIndex]
    })
  }

  // Convert digit to note name
  digitToNoteName(digit: number): string | null {
    const scaleDegree = this.digitToScaleDegree(digit)
    if (scaleDegree === null) return null
    
    const scaleNotes = this.getCurrentScaleNotes()
    return scaleNotes[scaleDegree] || null
  }

  // Convert digit to MIDI note number
  digitToMidiNote(digit: number, octave: number = 4): number | null {
    const noteName = this.digitToNoteName(digit)
    if (!noteName) return null
    
    try {
      return Note.midi(`${noteName}${octave}`) || null
    } catch {
      return null
    }
  }

  // Convert digit to chord notes based on current settings
  digitToChordNotes(digit: number, octave: number = 4): string[] {
    const scaleDegree = this.digitToScaleDegree(digit)
    if (scaleDegree === null) return []
    
    const scaleNotes = this.getCurrentScaleNotes()
    const rootNote = scaleNotes[scaleDegree]
    
    if (!rootNote) return []
    
    switch (this.currentChord) {
      case 'none':
      case 'Single Notes Only':
        return [`${rootNote}${octave}`]
        
      case 'triads':
      case 'Basic Triads':
        return this.buildTriadFromScale(scaleDegree, scaleNotes, octave)
        
      case 'seventh':
      case 'Seventh Chords':
        return this.buildSeventhFromScale(scaleDegree, scaleNotes, octave)
        
      case 'extended':
      case 'Extended Chords':
        return this.buildExtendedFromScale(scaleDegree, scaleNotes, octave)
        
      default:
        return [`${rootNote}${octave}`]
    }
  }

  // Build triad from scale (1-3-5)
  private buildTriadFromScale(scaleDegree: number, scaleNotes: string[], octave: number): string[] {
    const rootIndex = scaleDegree
    const scaleLength = 7 // Use 7 notes (without octave) for proper chord building
    
    const root = scaleNotes[rootIndex]
    const third = scaleNotes[(rootIndex + 2) % scaleLength]
    const fifth = scaleNotes[(rootIndex + 4) % scaleLength]
    
    return [
      `${root}${octave}`,
      `${third}${octave}`,
      `${fifth}${octave + (rootIndex + 4 >= scaleLength ? 1 : 0)}` // Handle octave jump
    ]
  }

  // Build seventh chord from scale (1-3-5-7)
  private buildSeventhFromScale(scaleDegree: number, scaleNotes: string[], octave: number): string[] {
    const rootIndex = scaleDegree
    const scaleLength = 7
    
    const root = scaleNotes[rootIndex]
    const third = scaleNotes[(rootIndex + 2) % scaleLength]
    const fifth = scaleNotes[(rootIndex + 4) % scaleLength]
    const seventh = scaleNotes[(rootIndex + 6) % scaleLength]
    
    return [
      `${root}${octave}`,
      `${third}${octave}`,
      `${fifth}${octave + (rootIndex + 4 >= scaleLength ? 1 : 0)}`,
      `${seventh}${octave + (rootIndex + 6 >= scaleLength ? 1 : 0)}`
    ]
  }

  // Build extended chord from scale (1-3-5-7-9)
  private buildExtendedFromScale(scaleDegree: number, scaleNotes: string[], octave: number): string[] {
    const rootIndex = scaleDegree
    const scaleLength = 7
    
    const root = scaleNotes[rootIndex]
    const third = scaleNotes[(rootIndex + 2) % scaleLength]
    const fifth = scaleNotes[(rootIndex + 4) % scaleLength]
    const seventh = scaleNotes[(rootIndex + 6) % scaleLength]
    const ninth = scaleNotes[(rootIndex + 1) % scaleLength] // 9th is same as 2nd
    
    return [
      `${root}${octave}`,
      `${third}${octave}`,
      `${fifth}${octave + (rootIndex + 4 >= scaleLength ? 1 : 0)}`,
      `${seventh}${octave + (rootIndex + 6 >= scaleLength ? 1 : 0)}`,
      `${ninth}${octave + 1}` // 9th is always in next octave
    ]
  }

  // Update settings
  setKey(key: string) {
    const validKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    if (!validKeys.includes(key)) {
      throw new Error(`Invalid key: ${key}. Valid keys: ${validKeys.join(', ')}`)
    }
    this.currentKey = key
  }

  setMode(mode: ModeType) {
    if (!MODES[mode]) {
      throw new Error(`Invalid mode: ${mode}. Valid modes: ${Object.keys(MODES).join(', ')}`)
    }
    this.currentMode = mode
  }

  setScale(scale: string) {
    this.currentScale = scale
  }

  setChord(chord: string) {
    this.currentChord = chord
  }

  // Get current settings
  getCurrentSettings() {
    return {
      key: this.currentKey,
      mode: this.currentMode,
      scale: this.currentScale,
      chord: this.currentChord,
      scaleNotes: this.getCurrentScaleNotes(),
      modeCharacter: MODES[this.currentMode].character
    }
  }

  // Debug method to test digit mapping
  testDigitMapping() {
    console.log(`\n🎵 Testing digit mapping for ${this.currentKey} ${this.currentMode}:`)
    console.log(`Scale notes: ${this.getCurrentScaleNotes().join(', ')}`)
    console.log(`Mode character: ${MODES[this.currentMode].character}`)
    console.log(`Chord type: ${this.currentChord}`)
    console.log('\nDigit mappings:')
    
    for (let digit = 2; digit <= 9; digit++) {
      const scaleDegree = this.digitToScaleDegree(digit)
      const noteName = this.digitToNoteName(digit)
      const chordNotes = this.digitToChordNotes(digit)
      console.log(`  ${digit} → Scale degree ${scaleDegree} → ${noteName} → [${chordNotes.join(', ')}]`)
    }
  }
}