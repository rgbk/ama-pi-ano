# πano Musical Controls - Technical Specification

## CRITICAL INSTRUCTIONS FOR CLAUDE CODE
- NEVER guess implementation details. Always ask user for clarification
- ALWAYS check official documentation before implementing
- Build in small, testable increments and verify each step
- When context is needed, reference the source URLs provided
- Ask user which component to prioritize when starting development

## PRIMARY RESOURCES
- Tone.js Documentation: https://tonejs.github.io/
- Tonal.js Documentation: https://github.com/tonaljs/tonal
- Working Examples: https://www.guitarland.com/MusicTheoryWithToneJS/PlayMajorScale.html
- Generative Music Architecture: https://github.com/generative-music/pieces-alex-bainter

## CURRENT SYSTEM STATE
- Application name: πano
- Existing setup: PolySynth wrapper around synth for polyphonic playback
- Purpose: Convert pi digits (0-9) into musical progressions with emotional character
- Stack: Tone.js for audio, needs Tonal.js for music theory

## ARCHITECTURE COMPONENTS

### Layer 1: Music Theory Engine
Use Tonal.js for all music theory calculations. Install via npm:
```bash
npm install tonal
```

Import specific modules as needed:
```javascript
import { Scale, Chord, Note, Interval } from "tonal";
```

### Layer 2: Mapping Engine
Converts pi digits to musical events based on selected strategy.

### Layer 3: Audio Engine
Your existing PolySynth wrapper handles playback.

## MUSIC THEORY IMPLEMENTATION

### Scales vs Modes - Core Concept
- **Scales**: Built from interval formulas (e.g., Major: [0,2,4,5,7,9,11])
- **Modes**: Rotations of parent scales

### Working Code Pattern from Guitarland.com
```javascript
// RTFM: Check https://www.guitarland.com/MusicTheoryWithToneJS/PlayModes.html for full context

// Convert note names to MIDI numbers for calculation
const MIDI_SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteNameToMIDI(noteName) {
    // Extracts note and octave, returns MIDI number
    // C4 = 60, C5 = 72, etc.
    var noteOnly = noteName.slice(0, -1);
    var octave = parseInt(noteName.slice(-1));
    return MIDI_SHARP_NAMES.indexOf(noteOnly) + (octave * 12) + 12;
}

// Mode creation through parent scale rotation
function makeMode(scaleNotes, modeNum) {
    var modeNotes = [];
    for(var i=0; i<scaleNotes.length; i++) {
        var scaleIndex = (i + modeNum) % scaleNotes.length;
        modeNotes.push(scaleNotes[scaleIndex]);
    }
    return modeNotes;
}

// Scale creation from interval formula
function makeScale(scaleFormula, keyNameAndOctave) {
    var startingNote = noteNameToMIDI(keyNameAndOctave);
    var myScale = [];
    for(var i=0; i < scaleFormula.length; i++) {
        myScale.push(MIDI_SHARP_NAMES[(scaleFormula[i] + startingNote) % 12]);
    }
    return myScale;
}
```

### Musical Modes and Emotional Characteristics
```javascript
const MODES = {
    ionian: {
        intervals: [0, 2, 4, 5, 7, 9, 11],
        character: "bright, happy, major",
        modeNumber: 0
    },
    dorian: {
        intervals: [0, 2, 3, 5, 7, 9, 10],
        character: "bittersweet, jazzy, contemplative",
        modeNumber: 1
    },
    phrygian: {
        intervals: [0, 1, 3, 5, 7, 8, 10],
        character: "dark, exotic, Spanish",
        modeNumber: 2
    },
    lydian: {
        intervals: [0, 2, 4, 6, 7, 9, 11],
        character: "ethereal, dreamy, floating",
        modeNumber: 3
    },
    mixolydian: {
        intervals: [0, 2, 4, 5, 7, 9, 10],
        character: "bluesy, groovy, dominant",
        modeNumber: 4
    },
    aeolian: {
        intervals: [0, 2, 3, 5, 7, 8, 10],
        character: "sad, natural minor, melancholic",
        modeNumber: 5
    },
    locrian: {
        intervals: [0, 1, 3, 5, 6, 8, 10],
        character: "unstable, diminished, tense",
        modeNumber: 6
    }
};
```

### Basic Chord Structures
```javascript
const CHORD_LIBRARY = {
    // Basic triads
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    
    // Seventh chords
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    dom7: [0, 4, 7, 10],
    m7b5: [0, 3, 6, 10],
    
    // Extended chords (basic set)
    maj9: [0, 4, 7, 11, 14],
    m9: [0, 3, 7, 10, 14],
    dom9: [0, 4, 7, 10, 14]
};
```

## DIGIT-TO-MUSIC MAPPING ALGORITHMS

### Strategy 1: Scale-Constrained Mapping
```javascript
function digitToScaleDegree(digit, scale) {
    // Map digit (0-9) to scale degree
    const scaleDegree = digit % scale.length;
    return scale[scaleDegree];
}
```

### Strategy 2: Chord Trigger Mapping
```javascript
function digitToChord(digit, key, chordProgression) {
    // Common progressions in each key
    const progressions = {
        major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
        minor: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']
    };
    
    const chordIndex = digit % progressions[key].length;
    return progressions[key][chordIndex];
}
```

### Strategy 3: Weighted Probability
```javascript
const NOTE_WEIGHTS = {
    tonic: 3,
    dominant: 2,
    subdominant: 2,
    mediant: 1,
    leadingTone: 1,
    supertonic: 1,
    submediant: 1
};

function weightedNoteSelection(digit, scale, weights) {
    // Create weighted array based on scale degrees
    // Implementation requires probability distribution
    // RTFM: Research weighted random selection algorithms
}
```

## TONE.JS INTEGRATION PATTERNS

### PolySynth Voice Management
```javascript
// RTFM: Check https://tonejs.github.io/docs/14.7.77/PolySynth for full API

const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: "sawtooth"
    },
    envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
    }
}).toDestination();

// Trigger chord
function playChord(notes, duration = "8n") {
    synth.triggerAttackRelease(notes, duration);
}

// Arpeggiate chord
function arpeggiate(notes, timing = "16n") {
    const now = Tone.now();
    notes.forEach((note, i) => {
        synth.triggerAttackRelease(note, "8n", now + i * Tone.Time(timing));
    });
}
```

### Transport Synchronization
```javascript
// All musical events should use Transport for timing
Tone.Transport.scheduleRepeat((time) => {
    // Get next pi digit
    const digit = getNextPiDigit();
    
    // Map to musical event
    const notes = mapDigitToNotes(digit);
    
    // Play with precise timing
    synth.triggerAttackRelease(notes, "8n", time);
}, "8n");

Tone.Transport.start();
```

## VOICE LEADING IMPLEMENTATION

### Basic Voice Leading Rules
```javascript
function calculateVoiceLeading(chord1, chord2) {
    // Minimize total movement between chords
    // RTFM: https://en.wikipedia.org/wiki/Voice_leading
    
    let minMovement = Infinity;
    let bestVoicing = null;
    
    // Try all inversions of chord2
    const inversions = getAllInversions(chord2);
    
    inversions.forEach(inversion => {
        const movement = calculateTotalMovement(chord1, inversion);
        if (movement < minMovement) {
            minMovement = movement;
            bestVoicing = inversion;
        }
    });
    
    return bestVoicing;
}

function calculateTotalMovement(chord1, chord2) {
    // Sum of semitone movements between voices
    return chord1.reduce((sum, note, i) => {
        return sum + Math.abs(noteToMIDI(note) - noteToMIDI(chord2[i]));
    }, 0);
}
```

## IMPLEMENTATION CHECKLIST FOR CLAUDE CODE

### Step 1: Setup and Dependencies
- [ ] Install Tonal.js via npm
- [ ] Verify existing PolySynth setup
- [ ] Create basic project structure

### Step 2: Music Theory Layer
- [ ] Implement scale/mode generation
- [ ] Setup chord library
- [ ] Create key signature system

### Step 3: Mapping System
- [ ] Build digit-to-note mapper
- [ ] Implement chord progression logic
- [ ] Add weighted selection option

### Step 4: User Controls
- [ ] Mode selector (dropdown)
- [ ] Key signature selector
- [ ] Chord complexity slider
- [ ] Tempo control
- [ ] Emotional preset buttons

### Step 5: Integration
- [ ] Connect all layers
- [ ] Test with pi digit sequence
- [ ] Optimize performance

## QUESTIONS CLAUDE CODE SHOULD ASK

1. "Which mapping strategy should we implement first: scale-constrained, chord triggers, or weighted probability?"
2. "Should we start with basic triads or include seventh chords from the beginning?"
3. "Do you want real-time mode switching or stop/restart when changing modes?"
4. "Should the pi digits control melody, harmony, or both simultaneously?"
5. "What should be the default tempo and note duration?"
6. "Should we implement preset emotional mappings first or individual controls?"
7. "Do you want visual feedback showing which pi digit is currently playing?"

## ERROR HANDLING REQUIREMENTS

```javascript
// Always wrap audio operations in try-catch
try {
    await Tone.start();
    // Audio operations
} catch (error) {
    console.error("Audio context error:", error);
    // Ask user for permission or alternative action
}

// Validate all musical inputs
function validateNote(note) {
    if (!Tone.Frequency(note).toFrequency()) {
        throw new Error(`Invalid note: ${note}`);
    }
}
```

## PERFORMANCE OPTIMIZATION NOTES

- Pre-calculate all scales and modes at initialization
- Cache frequently used chord voicings
- Use lookup tables for MIDI conversions
- Implement efficient voice leading with memoization
- Limit polyphony to prevent audio overload (max 8 voices recommended)

## ADDITIONAL RESOURCES TO CONSULT

- Tone.js Examples: https://tonejs.github.io/examples/
- Tonal.js Docs: https://github.com/tonaljs/tonal/tree/main/packages
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MIDI Specification: https://www.midi.org/specifications

---

END OF SPECIFICATION

Claude Code: Begin by asking the user which component to implement first, and always verify understanding before writing code.