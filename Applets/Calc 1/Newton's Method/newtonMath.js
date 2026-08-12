// ---------------------------------------------------------------------
// Hand-rolled recursive-descent expression parser (no mathjs — offline).
// Supports: + - * / ^, unary minus, parentheses, functions
// (sin cos tan sqrt abs exp ln log), constants (pi, e), variable x.
// ---------------------------------------------------------------------

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const s = src.replace(/\s+/g, '');
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ type: 'num', value: parseFloat(s.slice(i, j)) });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      tokens.push({ type: 'ident', value: s.slice(i, j) });
      i = j;
    } else if ('+-*/^(),'.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
    } else {
      throw new Error(`Unexpected character "${c}" in expression`);
    }
  }
  return tokens;
}

const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
};
const CONSTS = { pi: Math.PI, e: Math.E };

// Grammar:
// expr   := term (('+'|'-') term)*
// term   := unary (('*'|'/') unary)*
// unary  := '-' unary | power
// power  := atom ('^' unary)?          (right-assoc)
// atom   := number | const | 'x' | func '(' expr ')' | '(' expr ')'
// Implicit multiplication is NOT supported; user must type explicit '*'.
function parseExpression(src) {
  const tokens = tokenize(src);
  let pos = 0;

  function peek() {
    return tokens[pos];
  }
  function consume(expected) {
    const t = tokens[pos];
    if (!t || (expected && t.value !== expected)) {
      throw new Error(`Expected "${expected}" in expression`);
    }
    pos++;
    return t;
  }

  function parseAtom() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.type === 'num') {
      pos++;
      return { type: 'num', value: t.value };
    }
    if (t.type === 'op' && t.value === '(') {
      consume('(');
      const node = parseExpr();
      consume(')');
      return node;
    }
    if (t.type === 'ident') {
      pos++;
      if (t.value === 'x') return { type: 'var' };
      if (t.value in CONSTS) return { type: 'num', value: CONSTS[t.value] };
      if (t.value in FUNCS) {
        consume('(');
        const arg = parseExpr();
        consume(')');
        return { type: 'call', name: t.value, arg };
      }
      throw new Error(`Unknown identifier "${t.value}"`);
    }
    throw new Error('Unexpected token in expression');
  }

  function parsePower() {
    const base = parseAtom();
    if (peek() && peek().value === '^') {
      consume('^');
      const exp = parseUnary();
      return { type: 'bin', op: '^', left: base, right: exp };
    }
    return base;
  }

  function parseUnary() {
    if (peek() && peek().value === '-') {
      consume('-');
      return { type: 'neg', arg: parseUnary() };
    }
    return parsePower();
  }

  function parseTerm() {
    let node = parseUnary();
    while (peek() && (peek().value === '*' || peek().value === '/')) {
      const op = consume().value;
      const rhs = parseUnary();
      node = { type: 'bin', op, left: node, right: rhs };
    }
    return node;
  }

  function parseExpr() {
    let node = parseTerm();
    while (peek() && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const rhs = parseTerm();
      node = { type: 'bin', op, left: node, right: rhs };
    }
    return node;
  }

  const ast = parseExpr();
  if (pos !== tokens.length) throw new Error('Unexpected trailing tokens in expression');
  return ast;
}

function evalAst(node, x) {
  switch (node.type) {
    case 'num':
      return node.value;
    case 'var':
      return x;
    case 'neg':
      return -evalAst(node.arg, x);
    case 'call':
      return FUNCS[node.name](evalAst(node.arg, x));
    case 'bin': {
      const l = evalAst(node.left, x);
      const r = evalAst(node.right, x);
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '^': return Math.pow(l, r);
        default: throw new Error(`Unknown operator ${node.op}`);
      }
    }
    default:
      throw new Error('Unknown AST node');
  }
}

// Compiles a user-typed function string into { f, fp, label } where fp is a
// numeric (central-difference) derivative — safe for arbitrary typed input,
// since we can't symbolically differentiate a hand-rolled parser tree
// without materially more code, and the numeric result is plenty accurate
// for this teaching context.
export function compileFunction(src) {
  const ast = parseExpression(src);
  const f = (x) => evalAst(ast, x);
  const fp = (x) => {
    const h = 1e-5 * Math.max(1, Math.abs(x));
    return (f(x + h) - f(x - h)) / (2 * h);
  };
  return { f, fp, label: src };
}

// ---------------------------------------------------------------------
// Signed (real) cube root — for f(x) = ∛x, since negative bases must
// still return a real negative cube root rather than NaN.
// ---------------------------------------------------------------------
export function safeCbrt(x) {
  return Math.sign(x) * Math.pow(Math.abs(x), 1 / 3);
}

// ---------------------------------------------------------------------
// Fixed analytic function definitions for every locked tab — kept as
// exact closed-form f/f' (matching validate-newton.js) rather than routed
// through the generic parser, so the taught examples are bit-for-bit the
// validated ones.
// ---------------------------------------------------------------------
export const LOCKED_FUNCTIONS = {
  intro: {
    label: 'x² − 2',
    f: (x) => x * x - 2,
    fp: (x) => 2 * x,
  },
  diverge: {
    label: '∛x',
    f: (x) => safeCbrt(x),
    fp: (x) => (1 / 3) * Math.pow(Math.abs(x), -2 / 3),
  },
  flatTangent: {
    label: 'x³ − x',
    f: (x) => x * x * x - x,
    fp: (x) => 3 * x * x - 1,
  },
  oscillation: {
    label: 'x³ − 2x + 2',
    f: (x) => x * x * x - 2 * x + 2,
    fp: (x) => 3 * x * x - 2,
  },
  wrongRoot: {
    label: 'x³ − x',
    f: (x) => x * x * x - x,
    fp: (x) => 3 * x * x - 1,
  },
};

export const FREE_PLAY_PRESETS = [
  { label: 'x² − 2', src: 'x^2 - 2', defaultX1: 1 },
  { label: 'x³ − x', src: 'x^3 - x', defaultX1: 1.5 },
  { label: 'cos(x) − x', src: 'cos(x) - x', defaultX1: 1 },
  { label: 'x⁵ − x − 1', src: 'x^5 - x - 1', defaultX1: 1.5 },
];

// ---------------------------------------------------------------------
// Known roots per locked tab, for the green root marker(s) on the graph.
// Oscillation's cubic has only one real root, found here numerically
// (from a safely-converging guess) rather than hardcoding a rounded
// decimal, so it stays exact to machine precision.
// ---------------------------------------------------------------------
function findRoot(fn, guess) {
  let x = guess;
  for (let i = 0; i < 60; i++) {
    const d = fn.fp(x);
    x = x - fn.f(x) / (Math.abs(d) < 1e-12 ? 1e-12 : d);
  }
  return x;
}

export const KNOWN_ROOTS = {
  intro: [Math.SQRT2],
  diverge: [0],
  flatTangent: [-1, 0, 1],
  oscillation: [findRoot(LOCKED_FUNCTIONS.oscillation, -2)],
  wrongRoot: [-1, 0, 1],
};


// ---------------------------------------------------------------------
// Newton iteration core
// ---------------------------------------------------------------------
const DERIV_EPSILON = 1e-6;

export function newtonStep(fn, x) {
  let deriv = fn.fp(x);
  if (Math.abs(deriv) < DERIV_EPSILON) {
    deriv = deriv >= 0 ? DERIV_EPSILON : -DERIV_EPSILON;
  }
  return x - fn.f(x) / deriv;
}

// Returns an array of {n, x, isFlat, isOffscreenLarge} for n = 1..maxN
export function computeIterations(fn, x1, maxN) {
  const xs = [x1];
  let x = x1;
  for (let i = 1; i < maxN; i++) {
    x = newtonStep(fn, x);
    if (!isFinite(x)) break;
    xs.push(x);
  }
  return xs;
}

// ---------------------------------------------------------------------
// Free Play risk-detection thresholds (Claude's first-pass defaults per
// design discussion — flagged as tunable, not final):
//   - "flat tangent" if |f'(x1)| below this fraction of a typical scale
//   - "diverging" if the 4th iterate already exceeds this magnitude
//   - "oscillating" if x3 ≈ x1 (a 2-cycle) within tolerance
// ---------------------------------------------------------------------
export function assessRisk(fn, x1) {
  const FLAT_THRESHOLD = 0.08;
  const DIVERGE_MAGNITUDE = 50;
  const CYCLE_TOLERANCE = 1e-3;

  const deriv = fn.fp(x1);
  if (Math.abs(deriv) < FLAT_THRESHOLD) {
    return { type: 'flat', message: 'This guess may not converge — the tangent here is nearly flat.' };
  }

  const xs = computeIterations(fn, x1, 4);
  if (xs.length >= 4 && Math.abs(xs[3]) > DIVERGE_MAGNITUDE) {
    return { type: 'diverge', message: 'This guess appears to be diverging — the iterates are growing rapidly.' };
  }
  if (xs.length >= 3 && Math.abs(xs[2] - xs[0]) < CYCLE_TOLERANCE && Math.abs(xs[1] - xs[0]) > CYCLE_TOLERANCE) {
    return { type: 'oscillate', message: 'This guess looks like it may be oscillating between two values rather than converging.' };
  }
  return null;
}

export function formatNum(v, decimals = 4) {
  if (!isFinite(v)) return '—';
  return v.toFixed(decimals).replace(/\.?0+$/, (m) => (m === '.' + '0'.repeat(decimals) ? '' : m));
}

// Generic "which root is nearest to this starting guess" — used by Wrong
// Root's dashed-ring marker so the expected-vs-actual mismatch is visible
// regardless of which x1 is currently selected.
export function nearestRootIndex(roots, x1) {
  let best = 0;
  for (let i = 1; i < roots.length; i++) {
    if (Math.abs(x1 - roots[i]) < Math.abs(x1 - roots[best])) best = i;
  }
  return best;
}
