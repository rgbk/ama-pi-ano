# πano Mapping Strategy Decision and Implementation

## ANSWER TO MAPPING STRATEGY QUESTION

**Selected Strategy: Modified Scale Degrees with Dynamic Modifiers**

This is the optimal choice because the user's system has:
- Digits 0-1: Drum triggers + synth/effect modifiers
- Digits 2-9: Eight musical note triggers (perfect octave mapping)

## SYSTEM ARCHITECTURE

```javascript
// Core digit mapping structure
const DIGIT_MAPPING = {
    0: { type: 'kick', role: 'modifier' },
    1: { type: 'hihat', role: 'modifier' },
    2: { type: 'note', scaleDegree: 0 }, // Root
    3: { type: 'note', scaleDegree: 1 }, // 2nd
    4: { type: 'note', scaleDegree: 2 }, // 3rd
    5: { type: 'note', scaleDegree: 3 }, // 4th
    6: { type: 'note', scaleDegree: 4 }, // 5th
    7: { type: 'note', scaleDegree: 5 }, // 6th
    8: { type: 'note', scaleDegree: 6 }, // 7th
    9: { type: 'note', scaleDegree: 7 }  // Octave
};
```

## COMPLETE MODIFIER SYSTEM IMPLEMENTATION

### Step 1: Modifier State Management

```javascript
// RTFM: Tone.js Effects - https://tonejs.github.io/docs/14.7.77/Effect

class ModifierSystem {
    constructor(synth) {
        this.synth = synth;
        this.baseSettings = {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            },
            filter: {
                frequency: 8000,
                type: 'lowpass',
                rolloff: -12
            }
        };
        
        // Initialize effects chain
        this.effects = {
            filter: new Tone.Filter(8000, 'lowpass'),
            reverb: new Tone.Reverb({ decay: 1.5, wet: 0 }),
            delay: new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0 }),
            distortion: new Tone.Distortion({ distortion: 0, wet: 0 })
        };
        
        // Chain: synth -> filter -> delay -> reverb -> distortion -> destination
        this.synth.chain(
            this.effects.filter,
            this.effects.delay,
            this.effects.reverb,
            this.effects.distortion,
            Tone.Destination
        );
        
        // Modifier queue
        this.activeModifiers = [];
        this.modifierHistory = [];
    }
    
    applyKickModifier() {
        // 0 = kick + bass-heavy modification
        const modifications = {
            timestamp: Tone.now(),
            type: 'kick',
            changes: {
                oscillator: { type: 'sawtooth' },
                filter: { frequency: 2000 },
                envelope: { attack: 0.01, decay: 0.3 },
                effects: {
                    distortion: { wet: 0.2, distortion: 0.3 },
                    reverb: { wet: 0.1 }
                }
            }
        };
        
        this.transitionToModification(modifications);
        return modifications;
    }
    
    applyHihatModifier() {
        // 1 = hihat + bright/sparkly modification
        const modifications = {
            timestamp: Tone.now(),
            type: 'hihat',
            changes: {
                oscillator: { type: 'square' },
                filter: { frequency: 12000 },
                envelope: { attack: 0.001, decay: 0.05 },
                effects: {
                    delay: { wet: 0.3, delayTime: '16n' },
                    reverb: { wet: 0.2 }
                }
            }
        };
        
        this.transitionToModification(modifications);
        return modifications;
    }
    
    transitionToModification(mod) {
        // Smooth transitions using Tone.js rampTo
        // RTFM: https://tonejs.github.io/docs/14.7.77/Param#rampTo
        
        const rampTime = 0.1; // 100ms transition
        
        // Update filter
        if (mod.changes.filter) {
            this.effects.filter.frequency.rampTo(
                mod.changes.filter.frequency, 
                rampTime
            );
        }
        
        // Update effects wet levels
        if (mod.changes.effects) {
            Object.entries(mod.changes.effects).forEach(([effect, params]) => {
                if (this.effects[effect] && params.wet !== undefined) {
                    this.effects[effect].wet.rampTo(params.wet, rampTime);
                }
                if (effect === 'distortion' && params.distortion !== undefined) {
                    this.effects.distortion.distortion = params.distortion;
                }
            });
        }
        
        // Update synth settings
        if (mod.changes.oscillator) {
            this.synth.set({ oscillator: mod.changes.oscillator });
        }
        if (mod.changes.envelope) {
            this.synth.set({ envelope: mod.changes.envelope });
        }
        
        // Track modification
        this.activeModifiers.push(mod);
        this.modifierHistory.push(mod);
        
        // Auto-decay modifications after 2 beats
        Tone.Transport.scheduleOnce(() => {
            this.decayModification(mod);
        }, '+2n');
    }
    
    decayModification(mod) {
        // Gradually return to base settings
        const decayTime = 0.5;
        
        this.effects.filter.frequency.rampTo(
            this.baseSettings.filter.frequency,
            decayTime
        );
        
        // Decay all effects back to dry
        Object.values(this.effects).forEach(effect => {
            if (effect.wet) {
                effect.wet.rampTo(0, decayTime);
            }
        });
        
        // Remove from active modifiers
        this.activeModifiers = this.activeModifiers.filter(m => m !== mod);
    }
    
    getModifierInfluence() {
        // Calculate combined influence of all active modifiers
        if (this.activeModifiers.length === 0) return 1.0;
        
        // More recent modifiers have more influence
        const now = Tone.now();
        let totalInfluence = 0;
        
        this.activeModifiers.forEach(mod => {
            const age = now - mod.timestamp;
            const influence = Math.max(0, 1 - (age / 2)); // Decay over 2 seconds
            totalInfluence += influence;
        });
        
        return Math.min(1, totalInfluence);
    }
}
```

### Step 2: Eight-Note Scale System

```javascript
// RTFM: Musical scales and modes - https://github.com/tonaljs/tonal

class EightNoteScaleSystem {
    constructor() {
        // 8 intervals for each mode (including octave)
        this.modes = {
            ionian:     [0, 2, 4, 5, 7, 9, 11, 12],  // Major
            dorian:     [0, 2, 3, 5, 7, 9, 10, 12],  // Jazz/modal
            phrygian:   [0, 1, 3, 5, 7, 8, 10, 12],  // Spanish
            lydian:     [0, 2, 4, 6, 7, 9, 11, 12],  // Dreamy
            mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],  // Blues/rock
            aeolian:    [0, 2, 3, 5, 7, 8, 10, 12],  // Natural minor
            locrian:    [0, 1, 3, 5, 6, 8, 10, 12],  // Diminished
            harmonic:   [0, 2, 3, 5, 7, 8, 11, 12]   // Harmonic minor
        };
        
        this.currentMode = 'ionian';
        this.rootNote = 60; // Middle C (MIDI)
    }
    
    digitToMidiNote(digit) {
        // Digits 2-9 map to scale degrees 0-7
        if (digit < 2 || digit > 9) return null;
        
        const scaleDegree = digit - 2;
        const intervals = this.modes[this.currentMode];
        return this.rootNote + intervals[scaleDegree];
    }
    
    digitToFrequency(digit) {
        const midi = this.digitToMidiNote(digit);
        if (!midi) return null;
        
        // RTFM: Tone.js Frequency - https://tonejs.github.io/docs/14.7.77/Frequency
        return Tone.Frequency(midi, 'midi').toFrequency();
    }
    
    digitToNoteName(digit) {
        const midi = this.digitToMidiNote(digit);
        if (!midi) return null;
        
        return Tone.Frequency(midi, 'midi').toNote();
    }
    
    changeMode(newMode) {
        if (!this.modes[newMode]) {
            throw new Error(`Invalid mode: ${newMode}. Valid modes: ${Object.keys(this.modes).join(', ')}`);
        }
        this.currentMode = newMode;
    }
    
    transpose(semitones) {
        this.rootNote += semitones;
        // Keep within reasonable MIDI range
        this.rootNote = Math.max(24, Math.min(96, this.rootNote));
    }
}
```

### Step 3: Complete Pi Processing System

```javascript
// Main processing class that combines everything
// RTFM: Tone.js Transport - https://tonejs.github.io/docs/14.7.77/Transport

class PianoSystem {
    constructor() {
        // Initialize audio components
        this.synth = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 8,
            voice: Tone.Synth
        });
        
        // Initialize subsystems
        this.modifiers = new ModifierSystem(this.synth);
        this.scales = new EightNoteScaleSystem();
        
        // Drum samples (or synthesized)
        this.drums = {
            kick: new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 10,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    sustain: 0.01,
                    release: 1.4
                }
            }).toDestination(),
            
            hihat: new Tone.MetalSynth({
                frequency: 200,
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    release: 0.01
                },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5
            }).toDestination()
        };
        
        // State tracking
        this.lastDigitTime = null;
        this.modifierAccumulator = [];
        this.noteVelocity = 0.7;
    }
    
    processPiDigit(digit, timeOffset = 0) {
        const time = Tone.now() + timeOffset;
        
        switch(digit) {
            case 0:
                this.processKick(time);
                break;
            case 1:
                this.processHihat(time);
                break;
            default:
                this.processNote(digit, time);
        }
        
        this.lastDigitTime = time;
    }
    
    processKick(time) {
        // Play kick drum
        this.drums.kick.triggerAttackRelease('C1', '8n', time);
        
        // Apply bass-heavy modifier to upcoming notes
        this.modifiers.applyKickModifier();
        
        // Optional: Add compression/sidechain effect
        Tone.Master.volume.rampTo(-3, 0.01, time);
        Tone.Master.volume.rampTo(0, 0.1, time + 0.01);
    }
    
    processHihat(time) {
        // Play hihat
        this.drums.hihat.triggerAttackRelease('16n', time);
        
        // Apply bright modifier to upcoming notes
        this.modifiers.applyHihatModifier();
    }
    
    processNote(digit, time) {
        const noteName = this.scales.digitToNoteName(digit);
        if (!noteName) return;
        
        // Calculate velocity based on modifier influence
        const modInfluence = this.modifiers.getModifierInfluence();
        const velocity = this.noteVelocity * (0.5 + 0.5 * modInfluence);
        
        // Determine note duration based on next expected digit
        const duration = this.calculateNoteDuration();
        
        // Play the note with current modifications
        this.synth.triggerAttackRelease(
            noteName,
            duration,
            time,
            velocity
        );
        
        // Optional: Add note-specific expression
        this.addNoteExpression(digit, time);
    }
    
    calculateNoteDuration() {
        // Vary duration based on context
        const baseTime = '8n';
        
        // If modifiers are active, shorten notes for rhythmic effect
        if (this.modifiers.activeModifiers.length > 0) {
            return '16n';
        }
        
        return baseTime;
    }
    
    addNoteExpression(digit, time) {
        // Add subtle pitch bend or vibrato for expression
        if (digit === 9) {
            // Octave note gets vibrato
            const vibrato = new Tone.Vibrato({
                frequency: 4,
                depth: 0.1
            });
            // Apply temporarily
            this.synth.connect(vibrato);
            Tone.Transport.scheduleOnce(() => {
                this.synth.disconnect(vibrato);
                vibrato.dispose();
            }, time + 1);
        }
    }
}
```

### Step 4: Integration with Pi Sequence

```javascript
// Complete implementation for processing pi digits
// RTFM: https://tonejs.github.io/docs/14.7.77/Loop

class PiSequencer {
    constructor(pianoSystem) {
        this.piano = pianoSystem;
        this.piDigits = '31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679'; // First 100 digits
        this.currentIndex = 0;
        this.tempo = 120; // BPM
        this.isPlaying = false;
    }
    
    start() {
        Tone.Transport.bpm.value = this.tempo;
        
        // Create a loop that processes one digit per beat
        this.loop = new Tone.Loop((time) => {
            if (!this.isPlaying) return;
            
            const digit = parseInt(this.piDigits[this.currentIndex]);
            this.piano.processPiDigit(digit, time);
            
            // Advance to next digit
            this.currentIndex = (this.currentIndex + 1) % this.piDigits.length;
            
            // Optional: Notify UI of current position
            this.onDigitPlayed?.(digit, this.currentIndex);
            
        }, '8n'); // Eighth note intervals
        
        this.loop.start(0);
        this.isPlaying = true;
        Tone.Transport.start();
    }
    
    stop() {
        this.isPlaying = false;
        Tone.Transport.stop();
        this.loop.stop();
    }
    
    setTempo(bpm) {
        this.tempo = bpm;
        Tone.Transport.bpm.rampTo(bpm, 2); // 2 second ramp
    }
}
```

## TESTING SEQUENCE

```javascript
// Test implementation step by step
async function testSystem() {
    // 1. Initialize
    await Tone.start();
    const piano = new PianoSystem();
    const sequencer = new PiSequencer(piano);
    
    // 2. Test individual digits
    console.log('Testing digit 3 (note)...');
    piano.processPiDigit(3);
    
    await sleep(500);
    
    console.log('Testing digit 0 (kick + modifier)...');
    piano.processPiDigit(0);
    
    await sleep(500);
    
    console.log('Testing digit 4 (modified note)...');
    piano.processPiDigit(4);
    
    // 3. Test sequence
    console.log('Starting pi sequence...');
    sequencer.start();
    
    // 4. Test mode change
    setTimeout(() => {
        console.log('Changing to dorian mode...');
        piano.scales.changeMode('dorian');
    }, 5000);
    
    // 5. Test tempo change
    setTimeout(() => {
        console.log('Increasing tempo...');
        sequencer.setTempo(140);
    }, 10000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

## QUESTIONS FOR USER

1. "Should modifiers stack (0 then 1 = both effects) or replace each other?"
2. "How long should modifier effects last - until next modifier, fixed time, or decay naturally?"
3. "Should we implement velocity sensitivity based on digit value (higher digits = louder)?"
4. "Do you want visual feedback for active modifiers?"
5. "Should mode changes happen automatically based on pi patterns or only via user control?"

## ERROR HANDLING

```javascript
// Always validate before processing
function validateDigit(digit) {
    if (typeof digit !== 'number' || digit < 0 || digit > 9) {
        throw new Error(`Invalid digit: ${digit}. Must be 0-9.`);
    }
}

// Ensure audio context is ready
async function ensureAudioReady() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Audio context started');
    }
}
```

## PERFORMANCE CONSIDERATIONS

- Pre-calculate all 8 notes for current mode when mode changes
- Use object pools for temporary effects to avoid garbage collection
- Limit polyphony to 8 voices maximum
- Implement note stealing if polyphony exceeded
- Cache frequently used calculations

## NEXT STEPS

1. Implement this core system
2. Test with first 20 digits of pi
3. Add user controls for mode/tempo/root note
4. Optimize modifier transitions
5. Add visual feedback

---

This implementation leverages the unique 0/1 modifier system with 2-9 note mapping for maximum musical expression from pi's digits.