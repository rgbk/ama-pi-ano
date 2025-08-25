# πano Chord Implementation Specification

## CONFIRMATION: Implement Option C with Diatonic Chord Harmonization

**Yes, implement Option C!** The Chord dropdown should control whether we hear single notes, triads, seventh chords, or extended chords. Use Tonal.js to build the correct chord type for each scale degree.

## Implementation Requirements

### Core Behavior
When digits 2-9 play, the output depends on the Chord selection dropdown:
- **Single Notes Only**: Play just the scale degree (current behavior)
- **Basic Triads**: Play 3-note chords built on that scale degree
- **Seventh Chords**: Play 4-note chords
- **Extended Chords**: Play 5+ note chords (9ths, 11ths)

### Implementation Pattern

```javascript
function processMusicalDigit(digit) {
    const chordType = getSelectedChordType(); // From UI dropdown
    
    switch(chordType) {
        case 'Single Notes Only':
            // Current behavior - just one note
            playNote(digit);
            break;
            
        case 'Basic Triads':
            // Play 3-note chord built on scale degree
            playTriad(digit);
            break;
            
        case 'Seventh Chords':
            // Play 4-note chord
            playSeventhChord(digit);
            break;
            
        case 'Extended Chords':
            // Play 5+ note chords (9ths, 11ths)
            playExtendedChord(digit);
            break;
    }
}
```

## Diatonic Harmony Rules

Build chords that naturally occur in the selected scale. For example, in C Major:

```javascript
// Diatonic triads in C Major:
const diatonicTriads = {
    2: 'Dm',  // D minor (D-F-A) - ii chord
    3: 'Em',  // E minor (E-G-B) - iii chord
    4: 'F',   // F major (F-A-C) - IV chord
    5: 'G',   // G major (G-B-D) - V chord
    6: 'Am',  // A minor (A-C-E) - vi chord
    7: 'Bdim',// B diminished (B-D-F) - vii° chord
    8: 'C',   // C major (C-E-G) - I chord (octave)
    9: 'Dm',  // D minor octave up - ii chord
};

// Diatonic seventh chords in C Major:
const diatonicSevenths = {
    2: 'Dm7',    // D-F-A-C
    3: 'Em7',    // E-G-B-D
    4: 'Fmaj7',  // F-A-C-E
    5: 'G7',     // G-B-D-F (dominant 7th)
    6: 'Am7',    // A-C-E-G
    7: 'Bm7b5',  // B-D-F-A (half-diminished)
    8: 'Cmaj7',  // C-E-G-B
    9: 'Dm7',    // D-F-A-C (octave up)
};
```

## Tonal.js Integration

Use Tonal.js to automatically generate the correct chord for any key/mode/scale:

```javascript
import { Chord, Scale, Note } from 'tonal';

function buildDiatonicChord(scaleDegree, key, mode, chordType) {
    // Get the scale notes
    const scale = Scale.get(`${key} ${mode}`);
    const scaleNotes = scale.notes;
    
    // Get the root note for this scale degree
    const rootNote = scaleNotes[scaleDegree];
    
    // Build appropriate chord type
    let chordNotes;
    switch(chordType) {
        case 'Basic Triads':
            // Build triad using scale notes (1-3-5 from root)
            chordNotes = buildTriadFromScale(rootNote, scaleNotes);
            break;
            
        case 'Seventh Chords':
            // Build seventh chord (1-3-5-7 from root)
            chordNotes = buildSeventhFromScale(rootNote, scaleNotes);
            break;
            
        case 'Extended Chords':
            // Build extended chord (1-3-5-7-9)
            chordNotes = buildExtendedFromScale(rootNote, scaleNotes);
            break;
    }
    
    return chordNotes;
}

function buildTriadFromScale(root, scaleNotes) {
    const rootIndex = scaleNotes.indexOf(root);
    return [
        scaleNotes[rootIndex],
        scaleNotes[(rootIndex + 2) % scaleNotes.length],
        scaleNotes[(rootIndex + 4) % scaleNotes.length]
    ];
}
```

## Expected Behavior Examples

### Example 1: C Major, Basic Triads
- Digit 2 plays → C major triad (C4-E4-G4)
- Digit 3 plays → D minor triad (D4-F4-A4)
- Digit 4 plays → E minor triad (E4-G4-B4)

### Example 2: D Dorian, Seventh Chords
- Digit 2 plays → Dm7 (D4-F4-A4-C5)
- Digit 3 plays → Em7 (E4-G4-B4-D5)
- Digit 4 plays → Fmaj7 (F4-A4-C5-E5)

### Example 3: A Harmonic Minor, Single Notes
- Digit 2 plays → A4 (single note)
- Digit 3 plays → B4 (single note)
- Digit 4 plays → C5 (single note)

## Testing Instructions

1. Set Chord dropdown to "Single Notes Only" → Should hear current behavior (one note)
2. Set Chord dropdown to "Basic Triads" → Should hear 3 notes playing together
3. Set Chord dropdown to "Seventh Chords" → Should hear 4 notes playing together
4. Test with different keys and modes to ensure correct diatonic chords

## Important Notes

- **PolySynth is already configured** - it can handle multiple notes
- **This justifies the PolySynth implementation** - we're now using its full capabilities
- **Creates richer harmony** - pi will generate actual chord progressions
- **Maintains musical coherence** - diatonic chords sound naturally good together

## Benefits of This Implementation

1. **Musical Richness**: Instead of simple melodies, πano will create full harmonic progressions
2. **User Control**: The dropdown gives users artistic control over complexity
3. **Educational**: Users can hear how different chord types sound in different modes
4. **Professional Sound**: Diatonic harmony is what makes music sound "correct" to our ears

## Quick Implementation Path

```javascript
// Minimal working example
function playDigitWithChords(digit) {
    const chordType = document.getElementById('chordSelect').value;
    const notes = this.musicTheory.digitToChordNotes(digit, chordType);
    
    if (notes.length === 1) {
        // Single note
        this.synth.triggerAttackRelease(notes[0], '8n');
    } else {
        // Chord (multiple notes)
        this.synth.triggerAttackRelease(notes, '8n');
    }
}
```

This implementation will make πano sound incredibly rich - imagine pi playing jazz chord progressions automatically!