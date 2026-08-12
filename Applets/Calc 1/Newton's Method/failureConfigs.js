import { LOCKED_FUNCTIONS, KNOWN_ROOTS } from '../newtonMath.js';
import { COLORS } from '../Shared.jsx';

export const FAILURE_CONFIGS = {
  diverge: {
    id: 'diverge',
    fn: LOCKED_FUNCTIONS.diverge,
    roots: KNOWN_ROOTS.diverge,
    maxN: 8,
    roseTheme: true,
    hasToggle: false,
    x1: 1,
    // Widened to fit x1..x5 (1, -2, 4, -8, 16) on screen — this does mean
    // x1-x3 sit closer together than before, an inherent tradeoff of a
    // doubling sequence: showing more steps compresses the earlier ones.
    defaultView: { xMin: -12, xMax: 20, yMin: -3, yMax: 3 },
    useEdgeBadges: true,
    noToggleNote: 'Every nonzero starting guess diverges for this function \u2014 there\u2019s no \u201cgood\u201d guess to toggle to.',
    getCapMessage: () => ({
      text: 'Increasing n further won\u2019t help \u2014 larger guesses just diverge faster. This function defeats Newton\u2019s Method almost everywhere except the root itself.',
      color: COLORS.bad,
      bg: '#FBF1F4',
    }),
  },

  flatTangent: {
    id: 'flatTangent',
    fn: LOCKED_FUNCTIONS.flatTangent,
    roots: KNOWN_ROOTS.flatTangent,
    maxN: 12,
    hasToggle: true,
    badX1: 0.58,
    goodX1: 2,
    defaultView: { xMin: -3, xMax: 45, yMin: -2, yMax: 4 },
    goodView: { xMin: -0.5, xMax: 2.5, yMin: -2, yMax: 3 },
    useEdgeBadges: true,
    getCapMessage: (isGood) => {
      if (isGood) {
        return { text: 'This guess converged smoothly \u2014 no detour needed.', color: COLORS.good, bg: '#EEF7F1' };
      }
      return {
        text: 'Even after 12 iterations, this guess hasn\u2019t settled \u2014 a nearly-flat tangent can send you far away, and it can take many steps to recover, if it recovers at all.',
        color: COLORS.bad, bg: '#FBF1F4',
      };
    },
  },

  oscillation: {
    id: 'oscillation',
    fn: LOCKED_FUNCTIONS.oscillation,
    roots: KNOWN_ROOTS.oscillation,
    maxN: 12,
    hasToggle: true,
    badX1: 0,
    goodX1: -2,
    defaultView: { xMin: -1, xMax: 2, yMin: -1, yMax: 4 },
    goodView: { xMin: -3, xMax: 0.5, yMin: -2, yMax: 6 },
    useEdgeBadges: false,
    getCapMessage: (isGood) => {
      if (isGood) return null;
      return {
        text: 'No matter how far you increase n, this guess never settles \u2014 it\u2019s locked in an exact cycle, bouncing between x = 0 and x = 1 forever.',
        color: COLORS.bad, bg: '#FBF1F4',
      };
    },
  },

  wrongRoot: {
    id: 'wrongRoot',
    fn: LOCKED_FUNCTIONS.wrongRoot,
    roots: KNOWN_ROOTS.wrongRoot,
    maxN: 10,
    hasToggle: true,
    badX1: 0.49, // nearest root is 0 (distance 0.49) yet converges all the way to -1
    goodX1: 0.4, // nearest root is 0 (distance 0.4), converges to 0 as expected
    defaultView: { xMin: -2, xMax: 3, yMin: -3, yMax: 6 },
    goodView: { xMin: -2, xMax: 3, yMin: -3, yMax: 6 },
    showRootLegend: true,
    useEdgeBadges: false,
    getCapMessage: (isGood) => ({
      text: isGood
        ? 'This guess converged directly to its nearest root, x = 0, as expected.'
        : 'This guess did converge \u2014 just not to the root you might expect. x\u2081 = 0.49 is actually nearest to the root at 0 (distance 0.49, vs. 0.51 to root 1), but a small early swing sends it all the way to \u22121 instead.',
      color: COLORS.muted, bg: '#F0F0F8',
    }),
  },
};
