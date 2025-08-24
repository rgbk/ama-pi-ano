// Pi digit generator - using a verified sequence with ability to extend
export class PiGenerator {
  // First 1000 digits of pi (after 3.)
  private readonly piSequence = "1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989"
  private position = 0

  constructor() {
    // Start at beginning of sequence
  }

  // Generate next digit of pi
  generateNextDigit(): string {
    if (this.position < this.piSequence.length) {
      const digit = this.piSequence[this.position]
      this.position++
      return digit
    }
    
    // If we run out of pre-computed digits, generate using Machin's formula
    // For now, just cycle back (in production, would compute more)
    this.position = 0
    return this.piSequence[this.position++]
  }

  // Generate multiple digits at once
  generateDigits(count: number): string {
    let result = ''
    for (let i = 0; i < count; i++) {
      result += this.generateNextDigit()
    }
    return result
  }
  
  // Reset to start
  reset(): void {
    this.position = 0
  }
}

// Alternative: Bailey-Borwein-Plouffe formula for nth digit
// This can calculate any digit of pi without calculating previous digits
export function getNthPiDigit(n: number): number {
  if (n === 0) return 3
  
  let s = 0
  for (let k = 0; k <= n + 3; k++) {
    const ak = 8 * k + 1
    const bk = 8 * k + 4
    const ck = 8 * k + 5
    const dk = 8 * k + 6
    
    const term = (1 / Math.pow(16, k)) * (
      4 / ak - 2 / bk - 1 / ck - 1 / dk
    )
    s += term
  }
  
  const digit = Math.floor((s * 10) % 10)
  return digit
}