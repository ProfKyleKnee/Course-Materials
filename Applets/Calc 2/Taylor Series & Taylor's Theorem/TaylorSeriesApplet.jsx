import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ===== Math engine (Taylor-mode automatic differentiation) =====
// ===== Power series arithmetic (Taylor-mode automatic differentiation) =====
// A "Series" is coefficients [c0, c1, ..., cN] representing f(x0+h) = sum ck * h^k,
// truncated at degree N. If f is built from +,-,*,/,^ and sin/cos/exp/ln/atan/sqrt,
// these operations let us get EXACT Taylor coefficients of f at any center x0,
// to any order, without symbolic differentiation.
function zerosSeries(N) {
    return new Array(N + 1).fill(0);
}
function constSeries(c, N) {
    const s = zerosSeries(N);
    s[0] = c;
    return s;
}
// series for the variable itself: x = x0 + h -> [x0, 1, 0, 0, ...]
function varSeries(x0, N) {
    const s = zerosSeries(N);
    s[0] = x0;
    if (N >= 1)
        s[1] = 1;
    return s;
}
function add(a, b) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    for (let k = 0; k <= N; k++)
        r[k] = a[k] + b[k];
    return r;
}
function sub(a, b) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    for (let k = 0; k <= N; k++)
        r[k] = a[k] - b[k];
    return r;
}
function neg(a) {
    return a.map((v) => -v);
}
function scale(a, s) {
    return a.map((v) => v * s);
}
function mul(a, b) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    for (let k = 0; k <= N; k++) {
        let sum = 0;
        for (let i = 0; i <= k; i++)
            sum += a[i] * b[k - i];
        r[k] = sum;
    }
    return r;
}
function div(a, b) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    if (b[0] === 0) {
        // division by zero at center -> not defined; return NaNs
        return r.map(() => NaN);
    }
    for (let k = 0; k <= N; k++) {
        let sum = a[k];
        for (let i = 1; i <= k; i++)
            sum -= b[i] * r[k - i];
        r[k] = sum / b[0];
    }
    return r;
}
// derivative of a series (as a formal power series in h), same length (last coeff dropped conceptually -> pad 0)
function dSeries(a) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    for (let k = 0; k < N; k++)
        r[k] = (k + 1) * a[k + 1];
    return r;
}
// integral of a series given constant term c0
function intSeries(a, c0) {
    const N = a.length - 1;
    const r = zerosSeries(N);
    r[0] = c0;
    for (let k = 1; k <= N; k++)
        r[k] = a[k - 1] / k;
    return r;
}
function expSeries(u) {
    const N = u.length - 1;
    const y = zerosSeries(N);
    y[0] = Math.exp(u[0]);
    for (let n = 1; n <= N; n++) {
        let sum = 0;
        for (let k = 1; k <= n; k++)
            sum += k * u[k] * y[n - k];
        y[n] = sum / n;
    }
    return y;
}
function lnSeries(u) {
    const N = u.length - 1;
    const y = zerosSeries(N);
    if (u[0] <= 0)
        return y.map(() => NaN);
    y[0] = Math.log(u[0]);
    for (let n = 1; n <= N; n++) {
        let sum = n * u[n];
        for (let k = 1; k <= n - 1; k++)
            sum -= u[k] * (n - k) * y[n - k];
        y[n] = sum / (n * u[0]);
    }
    return y;
}
function sinCosSeries(u) {
    const N = u.length - 1;
    const s = zerosSeries(N);
    const c = zerosSeries(N);
    s[0] = Math.sin(u[0]);
    c[0] = Math.cos(u[0]);
    for (let n = 1; n <= N; n++) {
        let sSum = 0;
        let cSum = 0;
        for (let k = 1; k <= n; k++) {
            sSum += k * u[k] * c[n - k];
            cSum += k * u[k] * s[n - k];
        }
        s[n] = sSum / n;
        c[n] = -cSum / n;
    }
    return { sin: s, cos: c };
}
function atanSeries(u) {
    const N = u.length - 1;
    // y' = u' / (1+u^2); compute g = u'/(1+u^2) as a series of length N (degrees 0..N-1 meaningful),
    // then integrate.
    const up = dSeries(u); // length N+1, degree N term is 0 (fine)
    const u2 = mul(u, u);
    const w = add(u2, constSeries(1, N));
    const g = div(up, w);
    return intSeries(g, Math.atan(u[0]));
}
function sqrtSeries(u) {
    // u^(1/2) via exp(0.5 * ln(u)) -- requires u[0] > 0
    return expSeries(scale(lnSeries(u), 0.5));
}
function powSeriesConstExp(u, k) {
    if (Number.isInteger(k) && k >= 0) {
        // repeated multiplication, exact even if u[0] <= 0
        const N = u.length - 1;
        let r = constSeries(1, N);
        for (let i = 0; i < k; i++)
            r = mul(r, u);
        return r;
    }
    // general real exponent: u^k = exp(k * ln(u)), needs u[0] > 0
    return expSeries(scale(lnSeries(u), k));
}
class ParseError extends Error {
}
function tokenize(src) {
    const toks = [];
    let i = 0;
    const s = src.replace(/\s+/g, "");
    while (i < s.length) {
        const c = s[i];
        if ("+-*/^(),".includes(c)) {
            toks.push(c);
            i++;
        }
        else if (/[0-9.]/.test(c)) {
            let j = i;
            while (j < s.length && /[0-9.]/.test(s[j]))
                j++;
            toks.push(s.slice(i, j));
            i = j;
        }
        else if (/[a-zA-Z]/.test(c)) {
            let j = i;
            while (j < s.length && /[a-zA-Z]/.test(s[j]))
                j++;
            toks.push(s.slice(i, j));
            i = j;
        }
        else {
            throw new ParseError("Unexpected character: " + c);
        }
    }
    return toks;
}
function parseExpr(src) {
    const toks = tokenize(src);
    let pos = 0;
    function peek() {
        return toks[pos];
    }
    function next() {
        return toks[pos++];
    }
    function parsePrimary() {
        const t = peek();
        if (t === undefined)
            throw new ParseError("Unexpected end of input");
        if (t === "(") {
            next();
            const e = parseAddSub();
            if (peek() !== ")")
                throw new ParseError("Expected )");
            next();
            return e;
        }
        if (t === "-") {
            next();
            return { t: "neg", a: parseUnaryPow() };
        }
        if (t === "+") {
            next();
            return parseUnaryPow();
        }
        if (/^[0-9.]/.test(t)) {
            next();
            return { t: "num", v: parseFloat(t) };
        }
        if (/^[a-zA-Z]+$/.test(t)) {
            const funcs = ["sin", "cos", "tan", "exp", "ln", "log", "sqrt", "atan", "arctan"];
            if (funcs.includes(t)) {
                next();
                if (peek() !== "(")
                    throw new ParseError("Expected ( after " + t);
                next();
                const arg = parseAddSub();
                if (peek() !== ")")
                    throw new ParseError("Expected )");
                next();
                let fn = t;
                if (fn === "arctan")
                    fn = "atan";
                if (fn === "log")
                    fn = "ln";
                return { t: "call", fn, a: arg };
            }
            if (t === "x") {
                next();
                return { t: "var" };
            }
            if (t === "e") {
                next();
                return { t: "num", v: Math.E };
            }
            if (t === "pi") {
                next();
                return { t: "num", v: Math.PI };
            }
            throw new ParseError("Unknown identifier: " + t);
        }
        throw new ParseError("Unexpected token: " + t);
    }
    // exponent is right-associative and binds tighter than unary minus on the RIGHT
    // (so -x^2 = -(x^2)), but implicit mult like "2x" is not supported (require * )
    function parseUnaryPow() {
        const base = parsePrimary();
        if (peek() === "^") {
            next();
            const exp = parseUnaryPow(); // right-assoc, allows -exponents via unary handled in parsePrimary
            return { t: "bin", op: "^", l: base, r: exp };
        }
        return base;
    }
    function parseMulDiv() {
        let node = parseUnaryPow();
        while (peek() === "*" || peek() === "/") {
            const op = next();
            const rhs = parseUnaryPow();
            node = { t: "bin", op, l: node, r: rhs };
        }
        return node;
    }
    function parseAddSub() {
        let node = parseMulDiv();
        while (peek() === "+" || peek() === "-") {
            const op = next();
            const rhs = parseMulDiv();
            node = { t: "bin", op, l: node, r: rhs };
        }
        return node;
    }
    const result = parseAddSub();
    if (pos !== toks.length)
        throw new ParseError("Unexpected trailing input");
    return result;
}
// Evaluate a Node as a plain number at x = t
function evalNumeric(node, t) {
    switch (node.t) {
        case "num":
            return node.v;
        case "var":
            return t;
        case "neg":
            return -evalNumeric(node.a, t);
        case "call": {
            const a = evalNumeric(node.a, t);
            switch (node.fn) {
                case "sin": return Math.sin(a);
                case "cos": return Math.cos(a);
                case "tan": return Math.tan(a);
                case "exp": return Math.exp(a);
                case "ln": return Math.log(a);
                case "sqrt": return Math.sqrt(a);
                case "atan": return Math.atan(a);
                default: return NaN;
            }
        }
        case "bin": {
            const l = evalNumeric(node.l, t);
            const r = evalNumeric(node.r, t);
            switch (node.op) {
                case "+": return l + r;
                case "-": return l - r;
                case "*": return l * r;
                case "/": return l / r;
                case "^": return Math.pow(l, r);
            }
        }
    }
}
// Evaluate a Node as a Series expansion about center x0, to order N
function evalSeries(node, x0, N) {
    switch (node.t) {
        case "num":
            return constSeries(node.v, N);
        case "var":
            return varSeries(x0, N);
        case "neg":
            return neg(evalSeries(node.a, x0, N));
        case "call": {
            const a = evalSeries(node.a, x0, N);
            switch (node.fn) {
                case "sin": return sinCosSeries(a).sin;
                case "cos": return sinCosSeries(a).cos;
                case "tan": return div(sinCosSeries(a).sin, sinCosSeries(a).cos);
                case "exp": return expSeries(a);
                case "ln": return lnSeries(a);
                case "sqrt": return sqrtSeries(a);
                case "atan": return atanSeries(a);
                default: return zerosSeries(N).map(() => NaN);
            }
        }
        case "bin": {
            const l = evalSeries(node.l, x0, N);
            // exponent with a constant literal exponent: handle exactly (including non-integer)
            if (node.op === "^" && node.r.t === "num") {
                return powSeriesConstExp(l, node.r.v);
            }
            const r = evalSeries(node.r, x0, N);
            switch (node.op) {
                case "+": return add(l, r);
                case "-": return sub(l, r);
                case "*": return mul(l, r);
                case "/": return div(l, r);
                case "^": {
                    // general expr^expr = exp(r * ln(l))
                    return expSeries(mul(r, lnSeries(l)));
                }
            }
        }
    }
}
function compileFunction(src) {
    const ast = parseExpr(src);
    return {
        f: (t) => evalNumeric(ast, t),
        series: (x0, N) => evalSeries(ast, x0, N),
    };
}
function factorial(n) {
    let r = 1;
    for (let i = 2; i <= n; i++)
        r *= i;
    return r;
}


// ===== Application =====
const PRESETS = [
    {
        key: "exp",
        label: "eˣ",
        exprFor: () => "exp(x)",
        defaultX0: 0,
        x0Valid: () => true,
        x0Hint: "",
        radius: () => Infinity,
    },
    {
        key: "sin",
        label: "sin x",
        exprFor: () => "sin(x)",
        defaultX0: 0,
        x0Valid: () => true,
        x0Hint: "",
        radius: () => Infinity,
    },
    {
        key: "cos",
        label: "cos x",
        exprFor: () => "cos(x)",
        defaultX0: 0,
        x0Valid: () => true,
        x0Hint: "",
        radius: () => Infinity,
    },
    {
        key: "ln1x",
        label: "ln(1+x)",
        exprFor: () => "ln(1+x)",
        defaultX0: 0,
        x0Valid: (x0) => x0 > -1,
        x0Hint: "Must be greater than −1",
        radius: (x0) => Math.abs(x0 + 1),
    },
    {
        key: "inv1x",
        label: "1/(1−x)",
        exprFor: () => "1/(1-x)",
        defaultX0: 0,
        x0Valid: (x0) => x0 !== 1,
        x0Hint: "Cannot equal 1",
        radius: (x0) => Math.abs(x0 - 1),
    },
    {
        key: "atan",
        label: "arctan x",
        exprFor: () => "atan(x)",
        defaultX0: 0,
        x0Valid: () => true,
        x0Hint: "",
        radius: (x0) => Math.sqrt(x0 * x0 + 1),
    },
    {
        key: "binom",
        label: "(1+x)^k",
        exprFor: (k) => `(1+x)^${k}`,
        defaultX0: 0,
        x0Valid: (x0, k) => (Number.isInteger(k) && k >= 0 ? true : x0 > -1),
        x0Hint: "Must be greater than −1 (unless k is a non-negative integer)",
        radius: (x0, k) => (Number.isInteger(k) && k >= 0 ? Infinity : Math.abs(x0 + 1)),
        needsK: true,
    },
];
const N_MAX = 50;
// ---------- small helpers ----------
function fmt(v, digits = 4) {
    if (!isFinite(v))
        return v > 0 ? "∞" : "−∞";
    if (isNaN(v))
        return "—";
    if (Math.abs(v) !== 0 && (Math.abs(v) < 1e-4 || Math.abs(v) >= 1e6)) {
        return v.toExponential(2);
    }
    const s = v.toFixed(digits).replace(/\.?0+$/, (m) => (m === "." ? "" : m));
    return s === "-0" ? "0" : s || "0";
}
// picks a "nice" step (1/2/5 x 10^n) so the x-axis shows roughly targetCount ticks at any zoom level
function niceTicks(min, max, targetCount) {
    const span = max - min;
    if (!(span > 0))
        return { ticks: [], step: 1 };
    const rawStep = span / targetCount;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const niceNorm = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    const step = niceNorm * mag;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 1e-6; v += step) {
        ticks.push(Math.round(v / step) * step);
    }
    return { ticks, step };
}
function superscript(n) {
    const map = {
        "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
        "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
    };
    return String(n).split("").map((c) => map[c] ?? c).join("");
}
// exact rational coefficient info for presets at x0=0 (null = not expressible cheaply, use decimal)
function exactCoeffAt0(presetKey, kIdx) {
    if (kIdx === 0)
        return null; // constant term rendered as plain number either way
    function normalize(sign, num, denomText) {
        const denomVal = denomText.endsWith("!") ? factorial(parseInt(denomText, 10)) : parseInt(denomText || "1", 10);
        return { sign, num, denomText: denomVal === 1 ? "" : denomText };
    }
    switch (presetKey) {
        case "exp":
            return normalize(1, 1, `${kIdx}!`);
        case "sin":
            if (kIdx % 2 === 0)
                return null; // zero term
            return normalize(((kIdx - 1) / 2) % 2 === 0 ? 1 : -1, 1, `${kIdx}!`);
        case "cos":
            if (kIdx % 2 === 1)
                return null; // zero term
            return normalize((kIdx / 2) % 2 === 0 ? 1 : -1, 1, `${kIdx}!`);
        case "ln1x":
            return normalize(kIdx % 2 === 1 ? 1 : -1, 1, `${kIdx}`);
        case "inv1x":
            return normalize(1, 1, "");
        case "atan":
            if (kIdx % 2 === 0)
                return null;
            return normalize(((kIdx - 1) / 2) % 2 === 0 ? 1 : -1, 1, `${kIdx}`);
        default:
            return null;
    }
}
function exactConstAt0(presetKey) {
    switch (presetKey) {
        case "exp":
            return "1";
        case "sin":
            return "0";
        case "cos":
            return "1";
        case "ln1x":
            return "0";
        case "inv1x":
            return "1";
        case "atan":
            return "0";
        default:
            return null;
    }
}
// format a polynomial term c*(x-x0)^k as readable text
function termText(c, k, x0, exact) {
    const sign = c < 0 ? "−" : "+";
    const absC = Math.abs(c);
    let cStr;
    if (exact && typeof exact === "string") {
        cStr = exact;
    }
    else if (exact && typeof exact === "object") {
        cStr = exact.denomText ? `${exact.num}/${exact.denomText}` : `${exact.num}`;
    }
    else {
        cStr = fmt(absC, 4);
    }
    let varPart = "";
    if (k === 0) {
        varPart = "";
    }
    else {
        const base = x0 === 0 ? "x" : `(x${x0 > 0 ? "−" : "+"}${fmt(Math.abs(x0), 3)})`;
        varPart = k === 1 ? base : `${base}${superscript(k)}`;
    }
    let text;
    if (k === 0) {
        text = cStr;
    }
    else if (cStr === "1") {
        text = varPart;
    }
    else {
        text = `${cStr}${varPart}`;
    }
    return { text, sign };
}
// ---------- text-buffer numeric input hook ----------
function useNumericText(value, onCommit, decimals = 4) {
    const [text, setText] = useState(() => fmt(value, decimals));
    const focused = useRef(false);
    useEffect(() => {
        if (!focused.current)
            setText(fmt(value, decimals));
    }, [value, decimals]);
    const onChange = (s) => {
        setText(s);
        if (/^-?\d*\.?\d*$/.test(s) && s !== "" && s !== "-" && s !== "." && s !== "-.") {
            const v = parseFloat(s);
            if (!isNaN(v))
                onCommit(v);
        }
    };
    const onFocus = () => (focused.current = true);
    const onBlur = () => {
        focused.current = false;
        setText(fmt(value, decimals));
    };
    return { text, onChange, onFocus, onBlur, setText };
}
// ---------- main component ----------
function TaylorSeriesApplet() {
    const [presetKey, setPresetKey] = useState("exp");
    const [customExpr, setCustomExpr] = useState("atan(x)");
    const [k, setK] = useState(0.5);
    const [x0, setX0] = useState(0);
    const [nRaw, setNRaw] = useState(1); // continuous, for smooth slider glide
    const n = Math.round(nRaw);
    const [errorOn, setErrorOn] = useState(false);
    const [xSel, setXSel] = useState(0.8);
    const [aVal, setAVal] = useState(0);
    const [bVal, setBVal] = useState(0.8);
    const [mValue, setMValueRaw] = useState(0); // absolute M value (initialized properly once minValidM known)
    const mInitialized = useRef(false);
    const [view, setView] = useState({ xMin: -3, xMax: 3, yMin: -1, yMax: 5 });
    const [manualMode, setManualMode] = useState(false);
    const svgRef = useRef(null);
    const dragRef = useRef(null);
    const panLastRef = useRef(null);
    const graphColRef = useRef(null);
    const [graphColWidth, setGraphColWidth] = useState(0);
    // measure graph column width (so the n-slider box can match it when the rail is open)
    useEffect(() => {
        const el = graphColRef.current;
        if (!el || typeof ResizeObserver === "undefined")
            return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries)
                setGraphColWidth(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const preset = PRESETS.find((p) => p.key === presetKey);
    const exprSrc = presetKey === "custom" ? customExpr : preset.exprFor(k);
    const compiled = useMemo(() => {
        try {
            return compileFunction(exprSrc);
        }
        catch (e) {
            return null;
        }
    }, [exprSrc]);
    const x0Valid = preset ? preset.x0Valid(x0, k) : isFinite(compiled?.f(x0) ?? NaN);
    const xSelValid = preset ? preset.x0Valid(xSel, k) : isFinite(compiled?.f(xSel) ?? NaN);
    const x0Hint = preset ? preset.x0Hint : "Function may be undefined at x₀";
    // Taylor coefficients at x0, up to order n (and n+1 for derivative-bound use)
    const coeffs = useMemo(() => {
        if (!compiled || !x0Valid)
            return null;
        try {
            return compiled.series(x0, n);
        }
        catch {
            return null;
        }
    }, [compiled, x0, n, x0Valid]);
    function evalPoly(c, x, center) {
        let result = 0;
        let p = 1;
        for (let i = 0; i < c.length; i++) {
            result += c[i] * p;
            p *= x - center;
        }
        return result;
    }
    // sample curve + polynomial across the view domain for plotting
    const plotData = useMemo(() => {
        if (!compiled)
            return null;
        const N = 240;
        const pts = [];
        for (let i = 0; i <= N; i++) {
            const x = view.xMin + ((view.xMax - view.xMin) * i) / N;
            const fv = compiled.f(x);
            const pv = coeffs ? evalPoly(coeffs, x, x0) : NaN;
            pts.push({ x, f: fv, p: pv });
        }
        return pts;
    }, [compiled, coeffs, x0, view]);
    const fAtXSel = compiled ? compiled.f(xSel) : NaN;
    const pAtXSel = coeffs ? evalPoly(coeffs, xSel, x0) : NaN;
    const errorAtXSel = fAtXSel - pAtXSel;
    // interval validity for M: must contain both x0 and xSel
    const loNeeded = Math.min(x0, xSel);
    const hiNeeded = Math.max(x0, xSel);
    const intervalValid = aVal <= bVal && aVal <= loNeeded && bVal >= hiNeeded;
    const xInInterval = xSel >= Math.min(aVal, bVal) && xSel <= Math.max(aVal, bVal);
    // minimum valid M: max |f^(n+1)(t)| over [a,b] (samples)
    const minValidM = useMemo(() => {
        if (!compiled)
            return NaN;
        const lo = Math.min(aVal, bVal);
        const hi = Math.max(aVal, bVal);
        if (hi - lo < 1e-9) {
            try {
                const s = compiled.series(lo, n + 1);
                return Math.abs(s[n + 1] * factorial(n + 1));
            }
            catch {
                return NaN;
            }
        }
        const SAMPLES = 120;
        let maxAbs = 0;
        for (let i = 0; i <= SAMPLES; i++) {
            const t = lo + ((hi - lo) * i) / SAMPLES;
            try {
                const s = compiled.series(t, n + 1);
                const d = Math.abs(s[n + 1] * factorial(n + 1));
                if (isFinite(d) && d > maxAbs)
                    maxAbs = d;
            }
            catch {
                /* skip */
            }
        }
        return maxAbs;
    }, [compiled, aVal, bVal, n]);
    // upperM: bigger gap between typed M and minValidM -> proportionally smaller extra headroom
    const baseUpperM = (() => {
        if (!isFinite(minValidM) || isNaN(minValidM) || minValidM <= 1e-6) {
            return isFinite(mValue) && mValue > 5 ? Math.ceil(mValue * 1.2) : 5;
        }
        const gap = Math.max(0, mValue - minValidM);
        const extra = (6 * minValidM) / Math.sqrt(1 + gap / minValidM);
        return Math.ceil(mValue + extra);
    })();
    const upperM = baseUpperM;
    // keep mValue valid: initialize to minValidM, and clamp upward if minValidM increases past it
    useEffect(() => {
        if (!isFinite(minValidM))
            return;
        if (!mInitialized.current) {
            setMValueRaw(minValidM);
            mInitialized.current = true;
        }
        else if (mValue < minValidM) {
            setMValueRaw(minValidM);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minValidM]);
    function setMValue(v) {
        if (!isFinite(minValidM))
            return;
        setMValueRaw(Math.max(v, minValidM));
    }
    const mFrac = isFinite(mValue) && upperM > minValidM ? (mValue - minValidM) / (upperM - minValidM) : 0;
    const rnBound = isFinite(mValue) ? (mValue * Math.pow(Math.abs(xSel - x0), n + 1)) / factorial(n + 1) : NaN;
    const mBox = useNumericText(mValue, setMValue, 4);
    const mTypedNegative = parseFloat(mBox.text) < 0;
    // ---------- text buffers ----------
    const x0Box = useNumericText(x0, (v) => setX0(v), 3);
    const xSelBox = useNumericText(xSel, (v) => setXSel(v), 3);
    const aBox = useNumericText(aVal, (v) => setAVal(v), 3);
    const bBox = useNumericText(bVal, (v) => setBVal(v), 3);
    const kBox = useNumericText(k, (v) => setK(v), 3);
    // auto-track [a,b] to the needed interval until the student manually edits a or b
    const autoTrack = useRef(true);
    useEffect(() => {
        if (autoTrack.current) {
            setAVal(loNeeded);
            setBVal(hiNeeded);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loNeeded, hiNeeded]);
    function userEditedA(v) {
        autoTrack.current = false;
        setAVal(v);
    }
    function userEditedB(v) {
        autoTrack.current = false;
        setBVal(v);
    }
    // ---------- graph coordinate mapping ----------
    const VB_W = 900;
    const VB_H = 420;
    const PAD = 30;
    const toPx = useCallback((x, y) => {
        const px = PAD + ((x - view.xMin) / (view.xMax - view.xMin)) * (VB_W - 2 * PAD);
        const py = VB_H - PAD - ((y - view.yMin) / (view.yMax - view.yMin)) * (VB_H - 2 * PAD);
        return [px, py];
    }, [view]);
    const toData = useCallback((px, py) => {
        const x = view.xMin + ((px - PAD) / (VB_W - 2 * PAD)) * (view.xMax - view.xMin);
        const y = view.yMin + ((VB_H - PAD - py) / (VB_H - 2 * PAD)) * (view.yMax - view.yMin);
        return [x, y];
    }, [view]);
    function clientToData(clientX, clientY) {
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm)
            return [0, 0];
        const loc = pt.matrixTransform(ctm.inverse());
        return toData(loc.x, loc.y);
    }
    function onPointerMove(e) {
        if (!dragRef.current)
            return;
        if (dragRef.current === "pan") {
            const last = panLastRef.current;
            if (!last || !svgRef.current)
                return;
            const dxPx = e.clientX - last.x;
            const dyPx = e.clientY - last.y;
            panLastRef.current = { x: e.clientX, y: e.clientY };
            const rect = svgRef.current.getBoundingClientRect();
            setManualMode(true);
            setView((v) => {
                const scaleX = (v.xMax - v.xMin) / rect.width;
                const scaleY = (v.yMax - v.yMin) / rect.height;
                const dxData = dxPx * scaleX;
                const dyData = dyPx * scaleY;
                const nv = {
                    xMin: v.xMin - dxData,
                    xMax: v.xMax - dxData,
                    yMin: v.yMin + dyData,
                    yMax: v.yMax + dyData,
                };
                return clampView(nv);
            });
            return;
        }
        const [x] = clientToData(e.clientX, e.clientY);
        if (dragRef.current === "x0") {
            if (!preset || preset.x0Valid(x, k))
                setX0(x);
        }
        else {
            setXSel(x);
            autoTrack.current = false;
        }
    }
    function startDrag(which) {
        return (e) => {
            e.stopPropagation();
            dragRef.current = which;
            e.target.setPointerCapture(e.pointerId);
        };
    }
    function startPan(e) {
        dragRef.current = "pan";
        panLastRef.current = { x: e.clientX, y: e.clientY };
        e.target.setPointerCapture(e.pointerId);
    }
    function clampView(nv) {
        const spanX = nv.xMax - nv.xMin;
        const spanY = nv.yMax - nv.yMin;
        const leashX = 20 * spanX;
        const leashY = 20 * spanY;
        const cx = (nv.xMin + nv.xMax) / 2;
        const cy = (nv.yMin + nv.yMax) / 2;
        const fx0 = compiled ? compiled.f(x0) : 0;
        const anchorY = isFinite(fx0) ? fx0 : 0;
        let dx = 0, dy = 0;
        if (cx > x0 + leashX)
            dx = x0 + leashX - cx;
        else if (cx < x0 - leashX)
            dx = x0 - leashX - cx;
        if (cy > anchorY + leashY)
            dy = anchorY + leashY - cy;
        else if (cy < anchorY - leashY)
            dy = anchorY - leashY - cy;
        return { xMin: nv.xMin + dx, xMax: nv.xMax + dx, yMin: nv.yMin + dy, yMax: nv.yMax + dy };
    }
    // fitView: frame x0 (and xSel, if shown) with generous padding both directions
    function fitView(includeXSel) {
        if (!compiled)
            return;
        const pts = includeXSel ? [x0, xSel] : [x0];
        const lo = Math.min(...pts);
        const hi = Math.max(...pts);
        const spread = hi - lo;
        const xPad = Math.max(spread * 0.9, 1.5);
        const newXMin = lo - xPad;
        const newXMax = hi + xPad;
        // x-range only -- y-scale is left exactly as the user has it (no auto-rescaling on drag/autofit)
        setView((v) => ({ ...v, xMin: newXMin, xMax: newXMax }));
    }
    function resetView() {
        setManualMode(false);
        setView({ xMin: -3, xMax: 3, yMin: -1, yMax: 5 });
    }
    function settleRecenter() {
        if (!manualMode)
            fitView(errorOn);
    }
    function endDrag() {
        if (dragRef.current === "x0")
            settleRecenter();
        dragRef.current = null;
        panLastRef.current = null;
    }
    function autofitClick() {
        setManualMode(false);
        fitView(errorOn);
    }
    function zoom(factor) {
        setManualMode(true);
        setView((v) => {
            const cx = (v.xMin + v.xMax) / 2;
            const cy = (v.yMin + v.yMax) / 2;
            const hw = ((v.xMax - v.xMin) / 2) * factor;
            const hh = ((v.yMax - v.yMin) / 2) * factor;
            return { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
        });
    }
    // scroll-wheel zoom: needs a native, non-passive listener for preventDefault to reliably
    // stop the page from scrolling while the cursor is over the graph
    const zoomFnRef = useRef(zoom);
    zoomFnRef.current = zoom;
    useEffect(() => {
        const el = svgRef.current;
        if (!el)
            return;
        function onWheel(e) {
            e.preventDefault();
            zoomFnRef.current(e.deltaY > 0 ? 1.1 : 0.9);
        }
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);
    // build SVG path from sampled points, breaking on NaN/huge jumps (discontinuities/asymptotes)
    function buildPath(pts) {
        let d = "";
        let started = false;
        let prevPy = null;
        for (const p of pts) {
            if (!isFinite(p.y)) {
                started = false;
                prevPy = null;
                continue;
            }
            const [px, py] = toPx(p.x, p.y);
            if (prevPy !== null && Math.abs(py - prevPy) > VB_H * 1.5) {
                started = false;
            }
            d += (started ? "L" : "M") + px.toFixed(2) + "," + py.toFixed(2) + " ";
            started = true;
            prevPy = py;
        }
        return d;
    }
    const fPath = plotData ? buildPath(plotData.map((p) => ({ x: p.x, y: p.f }))) : "";
    const pPath = plotData ? buildPath(plotData.map((p) => ({ x: p.x, y: p.p }))) : "";
    // shaded error region between f and P from a to b
    let errorRegionPath = "";
    if (errorOn && plotData && coeffs && compiled) {
        const lo = Math.min(aVal, bVal);
        const hi = Math.max(aVal, bVal);
        const M = 60;
        const top = [];
        const bottom = [];
        for (let i = 0; i <= M; i++) {
            const x = lo + ((hi - lo) * i) / M;
            const fv = compiled.f(x);
            const pv = evalPoly(coeffs, x, x0);
            if (!isFinite(fv) || !isFinite(pv))
                continue;
            const [fx, fy] = toPx(x, fv);
            const [, py] = toPx(x, pv);
            top.push(`${fx.toFixed(2)},${fy.toFixed(2)}`);
            bottom.push(`${fx.toFixed(2)},${py.toFixed(2)}`);
        }
        if (top.length > 1) {
            errorRegionPath = "M" + top.join(" L") + " L" + bottom.reverse().join(" L") + " Z";
        }
    }
    const [x0Px, x0Py] = toPx(x0, compiled ? compiled.f(x0) : 0);
    const [xSelPxF, xSelPyF] = toPx(xSel, fAtXSel);
    const [, xSelPyP] = toPx(xSel, pAtXSel);
    const [, xSelPyAxis] = toPx(xSel, 0);
    // adaptive x-axis ticks: step re-picked from {1,2,5}x10^n every render so tick density stays
    // sane as the view zooms/pans, skipping any tick that would collide with x0/a/b's own labels
    const specialXs = [x0, ...(errorOn ? [aVal, bVal] : [])];
    const { ticks: axisTicks, step: tickStep } = niceTicks(view.xMin, view.xMax, 7);
    const tickDigits = Math.max(0, Math.ceil(-Math.log10(tickStep)));
    const filteredAxisTicks = axisTicks.filter((v) => !specialXs.some((s) => Math.abs(v - s) < tickStep * 0.2));
    // convergence band
    const R = preset ? preset.radius(x0, k) : Infinity;
    const hasBand = isFinite(R) && !!preset;
    const [bandX1] = hasBand ? toPx(x0 - R, 0) : [0];
    const [bandX2] = hasBand ? toPx(x0 + R, 0) : [0];
    // newest term = highest-order surviving (non-negligible) term, always highlighted
    const nonzeroIdx = coeffs ? coeffs.map((c, i) => i).filter((i) => coeffs[i] !== 0) : [];
    const survivingIdx = coeffs && nonzeroIdx.length > 0 ? nonzeroIdx : coeffs ? [0] : [];
    const useExact = x0 === 0 && presetKey !== "custom" && presetKey !== "binom";
    const TRUNCATE_AFTER = 10;
    const truncated = survivingIdx.length > TRUNCATE_AFTER + 1;
    const shownIdx = truncated
        ? [...survivingIdx.slice(0, TRUNCATE_AFTER), survivingIdx[survivingIdx.length - 1]]
        : survivingIdx;
    const polyTerms = coeffs
        ? shownIdx.map((i) => termText(coeffs[i], i, x0, useExact ? exactCoeffAt0(presetKey, i) : null))
        : [];
    const constExact = coeffs && useExact ? exactConstAt0(presetKey) : null;
    if (polyTerms.length && shownIdx[0] === 0 && constExact !== null) {
        polyTerms[0] = { text: constExact, sign: "+" };
    }
    return (React.createElement("div", { className: "ts-page-root" },
        React.createElement("div", { className: "ts-card" },
        React.createElement(Banner, null),
        React.createElement("div", { className: "ts-wrap" },
        React.createElement("style", null, CSS),
        React.createElement("div", { className: "ts-app-shell" },
            React.createElement("div", { className: "ts-fn-row" },
                React.createElement("div", { className: "ts-fn-prefix" },
                    React.createElement("span", null, "f(x) ="),
                    React.createElement("input", { className: "ts-fake-input", value: presetKey === "custom" ? customExpr : exprSrc, onChange: (e) => {
                            setCustomExpr(e.target.value);
                            setPresetKey("custom");
                        }, onBlur: () => {
                            if (presetKey === "custom")
                                resetView();
                        } })),
                PRESETS.map((p) => (React.createElement("button", { key: p.key, className: "ts-preset-pill" + (presetKey === p.key ? " active" : ""), onClick: () => {
                        setPresetKey(p.key);
                        setX0(p.defaultX0);
                        autoTrack.current = true;
                        resetView();
                    } }, p.label))),
                preset?.needsK && (React.createElement("div", { className: "ts-fn-prefix" },
                    React.createElement("span", null, "k ="),
                    React.createElement("input", { className: "ts-fake-input narrow", value: kBox.text, onChange: (e) => kBox.onChange(e.target.value), onFocus: kBox.onFocus, onBlur: kBox.onBlur })))),
            !x0Valid && (React.createElement("div", { className: "ts-danger-text", style: { marginBottom: 8 } }, x0Hint)),
            React.createElement("div", { className: "ts-main-row" + (errorOn ? " on" : " off") },
                React.createElement("div", { className: "ts-graph-col", ref: graphColRef },
                    React.createElement("div", { className: "ts-graph-box" },
                        React.createElement("div", { className: "ts-zoom-controls" },
                            React.createElement("button", { className: "ts-zoom-btn", onClick: () => zoom(0.8), title: "Zoom in" }, "+"),
                            React.createElement("button", { className: "ts-zoom-btn", onClick: () => zoom(1.25), title: "Zoom out" }, "\u2212"),
                            React.createElement("button", { className: "ts-zoom-btn", onClick: autofitClick, title: "Autofit x-range (frames x0 and x; y-scale untouched)" }, "\u2922"),
                            React.createElement("button", { className: "ts-zoom-btn", onClick: resetView, title: "Reset window to origin" }, "\u27F2"),
                            React.createElement("button", { className: "ts-err-btn" + (errorOn ? " on" : ""), onClick: () => {
                                    const turningOn = !errorOn;
                                    setErrorOn(turningOn);
                                    if (turningOn && !manualMode)
                                        fitView(true);
                                }, title: "Investigate Errors" }, "E")),
                        React.createElement("svg", { ref: svgRef, viewBox: `0 0 ${VB_W} ${VB_H}`, preserveAspectRatio: "none", onPointerMove: onPointerMove, onPointerUp: endDrag, onPointerDown: startPan },
                            React.createElement("rect", { x: 0, y: 0, width: VB_W, height: VB_H, fill: "transparent", style: { cursor: "grab" } }),
                            hasBand && (React.createElement(React.Fragment, null,
                                React.createElement("rect", { x: Math.max(bandX1, PAD), y: PAD - 15, width: Math.max(0, Math.min(bandX2, VB_W - PAD) - Math.max(bandX1, PAD)), height: VB_H - 2 * PAD + 15, fill: "rgba(100,120,214,0.10)" }),
                                React.createElement("text", { x: PAD, y: PAD - 3, fontSize: "12", fill: "#6478D6" },
                                    "R = ",
                                    fmt(R, 2)),
                                React.createElement("text", { x: PAD, y: PAD + 12, fontSize: "12", fill: "#6478D6" }, "Converges for all x inside the gray band"))),
                            !hasBand && preset && (React.createElement("text", { x: PAD, y: PAD - 8, fontSize: "12", fill: "#6478D6" }, "Converges for all real x")),
                            React.createElement("line", { x1: PAD, y1: toPx(0, 0)[1], x2: VB_W - PAD, y2: toPx(0, 0)[1], stroke: "#DCDCF0" }),
                            React.createElement("line", { x1: toPx(0, 0)[0], y1: PAD, x2: toPx(0, 0)[0], y2: VB_H - PAD, stroke: "#DCDCF0" }),
                            filteredAxisTicks.map((v, i) => {
                                const [px, axisY] = toPx(v, 0);
                                if (px < PAD || px > VB_W - PAD)
                                    return null;
                                return (React.createElement("g", { key: "auto" + i },
                                    React.createElement("line", { x1: px, y1: axisY - 3, x2: px, y2: axisY + 3, stroke: "#c9c9de", strokeWidth: 1 }),
                                    React.createElement("text", { x: px, y: axisY + 14, fontSize: "9.5", fill: "#A8A8BC", textAnchor: "middle" }, fmt(v, tickDigits))));
                            }),
                            [{ v: x0, color: "#6478D6" }, ...(errorOn ? [{ v: aVal, color: "#8A8AA3" }, { v: bVal, color: "#8A8AA3" }] : [])].map((t, i) => {
                                const [px, axisY] = toPx(t.v, 0);
                                if (px < PAD || px > VB_W - PAD)
                                    return null;
                                return (React.createElement("g", { key: i },
                                    React.createElement("line", { x1: px, y1: axisY - 4, x2: px, y2: axisY + 4, stroke: t.color, strokeWidth: 1.5 }),
                                    React.createElement("text", { x: px, y: axisY + 16, fontSize: "10.5", fill: t.color, textAnchor: "middle" }, fmt(t.v, 2))));
                            }),
                            errorOn && errorRegionPath && React.createElement("path", { d: errorRegionPath, fill: "rgba(199,123,148,0.16)" }),
                            React.createElement("path", { d: fPath, stroke: "#3A3A3C", strokeWidth: 2.5, fill: "none" }),
                            React.createElement("path", { d: pPath, stroke: "#3B4FC2", strokeWidth: 2.5, strokeDasharray: "6,4", fill: "none" }),
                            errorOn && isFinite(errorAtXSel) && (React.createElement(React.Fragment, null,
                                React.createElement("line", { x1: xSelPxF, y1: xSelPyF, x2: xSelPxF, y2: xSelPyP, stroke: "#B23A52", strokeWidth: 2.5, strokeDasharray: "4,3" }),
                                React.createElement("circle", { cx: xSelPxF, cy: xSelPyF, r: 7, fill: "#3A3A3C", style: { cursor: "ew-resize" }, onPointerDown: startDrag("xsel") }),
                                React.createElement("circle", { cx: xSelPxF, cy: xSelPyP, r: 7, fill: "#3B4FC2", style: { cursor: "ew-resize" }, onPointerDown: startDrag("xsel") }),
                                React.createElement("circle", { cx: xSelPxF, cy: xSelPyAxis, r: 8, fill: "white", stroke: "#B23A52", strokeWidth: 2, style: { cursor: "ew-resize" }, onPointerDown: startDrag("xsel") }))),
                            React.createElement("circle", { cx: x0Px, cy: x0Py, r: 9, fill: "rgba(100,120,214,0.18)" }),
                            React.createElement("circle", { cx: x0Px, cy: x0Py, r: 6, fill: "#6478D6", stroke: "white", strokeWidth: 1.5, style: { cursor: "ew-resize" }, onPointerDown: startDrag("x0") })),
                        React.createElement("div", { className: "ts-x0-box" },
                            "x\u2080 =",
                            React.createElement("input", { value: x0Box.text, onChange: (e) => x0Box.onChange(e.target.value), onFocus: x0Box.onFocus, onBlur: () => {
                                    x0Box.onBlur();
                                    settleRecenter();
                                } }))),
                    React.createElement("div", { className: "ts-poly-box" }, coeffs ? (React.createElement(React.Fragment, null,
                        "P",
                        React.createElement("sub", null, n),
                        "(x) =",
                        " ",
                        polyTerms.map((t, i) => (React.createElement(React.Fragment, { key: i },
                            truncated && i === polyTerms.length - 1 && (React.createElement("span", { className: "ts-ellipsis", title: `${survivingIdx.length - TRUNCATE_AFTER - 1} terms hidden` },
                                " ",
                                "\u22EF",
                                " ")),
                            React.createElement("span", { className: i === polyTerms.length - 1 ? "ts-term-new" : undefined },
                                i === 0 ? (t.sign === "−" ? "−" : "") : ` ${t.sign} `,
                                t.text)))))) : (React.createElement("span", { className: "ts-danger-text" }, "Function is undefined at x\u2080 \u2014 pick a different center.")))),
                errorOn && (React.createElement("div", { className: "ts-rail" },
                    React.createElement("div", { className: "ts-mini-readout" },
                        React.createElement("div", { className: "ts-eyebrow" }, "x (type your own)"),
                        React.createElement("div", { className: "ts-interval-box wide" + "" },
                            React.createElement("span", null, "x ="),
                            React.createElement("input", { value: xSelBox.text, onChange: (e) => xSelBox.onChange(e.target.value), onFocus: xSelBox.onFocus, onBlur: xSelBox.onBlur })),
                        !xSelValid && preset && preset.x0Hint && React.createElement("div", { className: "ts-danger-text" }, preset.x0Hint),
                        !xSelValid && !preset && React.createElement("div", { className: "ts-danger-text" }, "f(x) is undefined at this value of x."),
                        React.createElement("div", { className: "ts-caption" }, "A value of x where we want to measure the error between the polynomial and f(x).")),
                    React.createElement("div", { className: "ts-mini-readout" },
                        React.createElement("div", { className: "ts-eyebrow" }, "|Error|"),
                        React.createElement("div", { className: "ts-val" }, fmt(Math.abs(errorAtXSel), 5)),
                        React.createElement("div", { className: "ts-caption" }, "The error between the polynomial and f(x) at the indicated value of x.")),
                    React.createElement("div", { className: "ts-mini-readout" },
                        React.createElement("div", { className: "ts-eyebrow" },
                            "R",
                            superscript(n),
                            " bound"),
                        xInInterval ? (React.createElement("div", { className: "ts-val" },
                            "\u2264 ",
                            fmt(rnBound, 5))) : (React.createElement("div", { className: "ts-danger-text", style: { marginTop: 4 } }, "Taylor's Theorem doesn't guarantee this bound when x is outside the interval [a,b] - pick an x inside [a,b], or widen [a,b] to include it.")),
                        xInInterval && (React.createElement("div", { className: "ts-caption" }, "The maximum error predicted by Taylor's Theorem (based on the value of M chosen)."))),
                    React.createElement("div", { className: "ts-rail-divider" }),
                    React.createElement("div", { className: "ts-m-block" },
                        React.createElement("div", { className: "ts-panel-header-row" },
                            React.createElement("div", { className: "ts-eyebrow" }, "Bound M"),
                            React.createElement("span", { className: "ts-eyebrow", style: { color: "#8A8AA3" } }, "auto min")),
                        React.createElement("div", { className: "ts-m-input-box wide" },
                            React.createElement("span", null, "M ="),
                            React.createElement("input", { value: mBox.text, onChange: (e) => mBox.onChange(e.target.value), onFocus: mBox.onFocus, onBlur: mBox.onBlur })),
                        mTypedNegative && React.createElement("div", { className: "ts-danger-text" }, "M can't be negative \u2014 it's a bound on an absolute value."),
                        React.createElement("button", { className: "ts-jump-btn wide", onClick: () => {
                                setMValueRaw(minValidM);
                                mBox.setText(fmt(minValidM, 4));
                            }, title: "Jump to the minimum valid M" }, "Jump to min / reset"),
                        React.createElement("div", { className: "ts-fake-slider" },
                            React.createElement("div", { className: "ts-fill", style: { width: `${mFrac * 100}%` } }),
                            React.createElement("input", { type: "range", min: 0, max: 1, step: 0.001, value: mFrac, onChange: (e) => {
                                    const frac = parseFloat(e.target.value);
                                    setMValueRaw(minValidM + frac * (upperM - minValidM));
                                }, className: "ts-range-overlay" }),
                            React.createElement("div", { className: "ts-handle", style: { left: `${mFrac * 100}%` } })),
                        React.createElement("div", { className: "ts-interval-row" },
                            React.createElement("div", { className: "ts-interval-box small" + (!intervalValid ? " invalid" : "") },
                                React.createElement("span", null, "a"),
                                React.createElement("input", { value: aBox.text, onChange: (e) => aBox.onChange(e.target.value), onFocus: aBox.onFocus, onBlur: () => {
                                        aBox.onBlur();
                                        userEditedA(parseFloat(aBox.text));
                                    } })),
                            React.createElement("div", { className: "ts-interval-box small" + (!intervalValid ? " invalid" : "") },
                                React.createElement("span", null, "b"),
                                React.createElement("input", { value: bBox.text, onChange: (e) => bBox.onChange(e.target.value), onFocus: bBox.onFocus, onBlur: () => {
                                        bBox.onBlur();
                                        userEditedB(parseFloat(bBox.text));
                                    } }))),
                        React.createElement("button", { className: "ts-shrink-btn wide", title: "Shrink [a,b] to the smallest valid interval", onClick: () => {
                                autoTrack.current = false;
                                setAVal(loNeeded);
                                setBVal(hiNeeded);
                            } }, "Shrink to smallest possible [a,b]"),
                        !intervalValid && (React.createElement("div", { className: "ts-danger-text" },
                            "Interval [a, b] must contain both x\u2080 (",
                            fmt(x0, 2),
                            ") and x (",
                            fmt(xSel, 2),
                            ").")),
                        React.createElement("div", { className: "ts-helper-text" },
                            "|f",
                            superscript(n + 1),
                            "(x)| \u2264 M on [a, b] \u2192 minimum valid M = ",
                            intervalValid ? fmt(minValidM, 4) : "—"))))),
            React.createElement("div", { className: "ts-n-hero", style: errorOn && graphColWidth ? { width: graphColWidth, maxWidth: "none" } : undefined },
                React.createElement("div", { className: "ts-n-top" },
                    React.createElement("span", { className: "ts-n-label" }, "DEGREE n"),
                    React.createElement("span", { className: "ts-n-val" },
                        "n = ",
                        n)),
                React.createElement("div", { className: "ts-n-track-wrap" },
                    React.createElement("div", { className: "ts-fake-slider thin" },
                        React.createElement("div", { className: "ts-tick-row" }, Array.from({ length: N_MAX }).map((_, i) => (React.createElement("div", { className: "ts-tick", key: i })))),
                        React.createElement("div", { className: "ts-fill", style: { width: `${((nRaw - 1) * 100) / (N_MAX - 1)}%` } }),
                        React.createElement("input", { type: "range", min: 1, max: N_MAX, step: 0.01, value: nRaw, onChange: (e) => setNRaw(parseFloat(e.target.value)), className: "ts-range-overlay" }),
                        React.createElement("div", { className: "ts-handle thin", style: { left: `${((nRaw - 1) * 100) / (N_MAX - 1)}%` } }))))))),
        React.createElement(PageCredit, null)));
}
function Banner() {
    return (React.createElement("div", { style: {
            display: "flex", alignItems: "center", padding: "16px 28px",
            background: "linear-gradient(135deg, #3B4FC2, #4A5CD6)",
            position: "relative", overflow: "hidden", borderRadius: "20px 20px 0 0"
        } },
        React.createElement("svg", { viewBox: "0 0 1200 130", preserveAspectRatio: "none",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.14, pointerEvents: "none" } },
            React.createElement("path", { d: "M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75", stroke: "white", strokeWidth: "2.5", fill: "none" })),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 } },
            React.createElement("a", { href: "../../../browse.html#/applets", style: {
                    display: "inline-flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.88)",
                    textDecoration: "none", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                    padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.12)"
                } }, "← All Applets"),
            React.createElement("div", { style: { width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.22)" } }),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 2 } },
                React.createElement("div", { style: {
                        fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)",
                        letterSpacing: "0.08em", textTransform: "uppercase"
                    } }, "Calculus II · Unit 4"),
                React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.005em" } }, "Taylor Series Explorer")))));
}
function PageCredit() {
    return (React.createElement("div", { style: {
            marginTop: "auto", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 11, padding: "18px 20px 26px", fontSize: 13.5, color: "#8A8AA3"
        } },
        React.createElement("span", { style: {
                width: 40, height: 40, borderRadius: "50%", background: "#FFFFFF", border: "1px solid #DCDCF0",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            } },
            React.createElement("img", { src: "../../../assets/favicon.svg", alt: "", width: "28", height: "28" })),
        "Professor Kyle Knee · Harper College Mathematics"));
}
const CSS = `
.ts-page-root{height:100%;box-sizing:border-box;background:#E8E8F2;padding:24px 24px 0;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#3A3A3C;}
.ts-card{border-radius:20px;box-shadow:0 4px 24px rgba(60,60,90,0.14);overflow:hidden;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;max-width:1200px;margin:0 auto;}
.ts-wrap *{box-sizing:border-box;}
.ts-wrap{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;color:#3A3A3C;background:#F5F5FA;padding:14px;width:100%;display:flex;justify-content:center;box-sizing:border-box;flex:1 1 auto;min-height:0;}
.ts-app-shell{background:#FFFFFF;border-radius:20px;box-shadow:0 1px 3px rgba(60,60,90,0.08);padding:16px;box-sizing:border-box;margin:0 auto;width:100%;max-width:1200px;display:flex;flex-direction:column;min-height:0;}
.ts-caption{font-size:9.5px;color:#8A8AA3;line-height:1.3;margin-top:5px;}
.ts-ellipsis{color:#8A8AA3;font-weight:700;}
.ts-interval-box.small{flex:none;width:88px;}
.ts-interval-box.wide{width:100%;}
.ts-shrink-btn{border:1px solid #DCDCF0;border-radius:14px;padding:5px 10px;font-size:10.5px;background:white;color:#3A3A3C;white-space:nowrap;cursor:pointer;font-family:inherit;}
.ts-shrink-btn:hover{background:#F0F0F8;}
.ts-fn-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;flex-shrink:0;}
.ts-fn-prefix{display:flex;border:1px solid #DCDCF0;border-radius:20px;overflow:hidden;font-size:13px;align-items:center;}
.ts-fn-prefix span{background:#F0F0F8;padding:6px 10px;color:#6E6E86;font-weight:600;white-space:nowrap;}
.ts-fake-input{border:none;padding:6px 10px;font-size:13px;width:110px;font-family:inherit;color:#3A3A3C;outline:none;}
.ts-fake-input.narrow{width:50px;}
.ts-preset-pill{border:1px solid #DCDCF0;border-radius:20px;padding:5px 12px;font-size:12px;background:white;cursor:pointer;font-family:inherit;color:#3A3A3C;}
.ts-preset-pill.active{background:#3B4FC2;color:white;border-color:#3B4FC2;}
.ts-danger-text{font-size:11.5px;color:#C77B94;font-weight:600;}
.ts-main-row{display:grid;gap:16px;transition:grid-template-columns 0.28s ease;flex:1 1 auto;min-height:0;}
.ts-main-row.off{grid-template-columns:1fr;}
.ts-main-row.on{grid-template-columns:1fr 220px;}
.ts-graph-col{display:flex;flex-direction:column;min-height:0;}
.ts-graph-box{background:#FBFBFE;border:1px solid #DCDCF0;border-radius:12px 12px 0 0;padding:8px;position:relative;flex:1 1 auto;min-height:160px;display:flex;}
.ts-graph-box svg{display:block;width:100%;height:100%;touch-action:none;}
.ts-zoom-controls{position:absolute;top:12px;right:12px;display:flex;flex-direction:column;gap:5px;z-index:2;}
.ts-zoom-btn{width:24px;height:24px;border-radius:50%;background:white;border:1px solid #DCDCF0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#6E6E86;font-weight:600;cursor:pointer;padding:0;}
.ts-err-btn{width:24px;height:24px;border-radius:6px;background:white;border:1px solid #DCDCF0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#6E6E86;cursor:pointer;padding:0;}
.ts-err-btn.on{background:#3B4FC2;color:white;border-color:#3B4FC2;}
.ts-x0-box{position:absolute;left:6px;bottom:14px;display:inline-flex;align-items:center;gap:5px;background:#FBFBFE;border:1.5px solid #6478D6;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;color:#3B4FC2;z-index:2;}
.ts-x0-box input{border:none;background:transparent;width:40px;text-align:center;font-weight:700;color:#3B4FC2;font-size:12px;font-family:inherit;outline:none;}
.ts-poly-box{background:white;border:1px solid #DCDCF0;border-top:none;border-radius:0 0 12px 12px;padding:12px 16px;font-size:14px;font-variant-numeric:tabular-nums;min-height:20px;flex-shrink:0;}
.ts-term-new{background:rgba(59,79,194,0.12);border-radius:5px;padding:1px 5px;color:#3B4FC2;font-weight:700;}
.ts-rail{display:flex;flex-direction:column;gap:8px;min-height:0;overflow-y:auto;overflow-x:hidden;}
.ts-mini-readout{background:white;border:1px solid #DCDCF0;border-radius:9px;padding:6px 8px;text-align:center;}
.ts-eyebrow{text-transform:uppercase;letter-spacing:0.06em;font-size:10.5px;color:#8A8AA3;font-weight:600;}
.ts-val{font-size:14px;font-weight:700;color:#3B4FC2;font-variant-numeric:tabular-nums;margin-top:2px;}
.ts-val-input{border:none;background:transparent;text-align:center;font-weight:700;color:#3B4FC2;font-size:14px;width:100%;font-family:inherit;outline:none;}
.ts-rail-divider{height:1px;background:#DCDCF0;margin:2px 0;}
.ts-m-block{background:white;border:1px solid #DCDCF0;border-radius:12px;padding:10px 12px;}
.ts-panel-header-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.ts-m-input-row{display:flex;align-items:center;gap:8px;margin-bottom:2px;}
.ts-m-input-box{display:flex;border:1.5px solid #6478D6;border-radius:16px;overflow:hidden;font-size:13px;flex:1;align-items:center;}
.ts-m-input-box.wide{width:100%;}
.ts-jump-btn.wide,.ts-shrink-btn.wide{width:100%;margin-top:6px;text-align:center;}
.ts-m-input-box span{background:#F0F0F8;padding:5px 8px;color:#6E6E86;font-weight:600;white-space:nowrap;flex-shrink:0;}
.ts-m-input-box input{border:none;padding:5px 8px;width:100%;font-size:13px;font-weight:700;color:#3B4FC2;font-family:inherit;outline:none;}
.ts-jump-btn{border:1px solid #DCDCF0;border-radius:14px;padding:5px 10px;font-size:10.5px;background:white;color:#3A3A3C;white-space:nowrap;cursor:pointer;font-family:inherit;}
.ts-jump-btn:hover{background:#F0F0F8;}
.ts-fake-slider{height:8px;border-radius:4px;background:#DCDCF0;position:relative;margin-top:8px;}
.ts-fake-slider.big{height:9px;margin-top:10px;}
.ts-fill{position:absolute;left:0;top:0;bottom:0;background:#3B4FC2;border-radius:4px;pointer-events:none;}
.ts-handle{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:#3B4FC2;border:2.5px solid white;box-shadow:0 1px 3px rgba(60,60,90,0.3);transform:translate(-50%,-50%);pointer-events:none;}
.ts-handle.big{width:24px;height:24px;border-width:4px;}
.ts-range-overlay{position:absolute;left:-8px;right:-8px;top:-10px;bottom:-10px;width:calc(100% + 16px);opacity:0;cursor:pointer;margin:0;}
.ts-interval-row{display:flex;gap:8px;align-items:center;margin-top:10px;}
.ts-interval-box{display:flex;border:1px solid #DCDCF0;border-radius:16px;overflow:hidden;font-size:12px;align-items:center;flex:1;}
.ts-interval-box.invalid{border-color:#C0304A;}
.ts-interval-box span{background:#F0F0F8;padding:4px 8px;color:#6E6E86;font-weight:600;white-space:nowrap;flex-shrink:0;}
.ts-interval-box input{border:none;padding:4px 8px;width:100%;font-size:12px;font-family:inherit;outline:none;}
.ts-helper-text{font-size:11px;color:#6E6E86;margin-top:8px;line-height:1.4;}
.ts-n-hero{background:linear-gradient(180deg,#FFFFFF,#FBFBFE);border:1.5px solid #6478D6;border-radius:14px;padding:16px 18px;margin-top:10px;flex-shrink:0;}
.ts-n-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.ts-n-label{font-size:13px;font-weight:700;color:#3B4FC2;letter-spacing:0.03em;}
.ts-n-val{font-size:20px;font-weight:800;color:#3B4FC2;font-variant-numeric:tabular-nums;}
.ts-n-track-wrap{display:flex;}
.ts-fake-slider.thin{height:5px;width:100%;}
.ts-handle.thin{width:16px;height:16px;border-width:3px;}
.ts-tick-row{position:absolute;left:0;right:0;top:50%;display:flex;justify-content:space-between;transform:translateY(-50%);pointer-events:none;}
.ts-tick{width:1px;height:9px;background:#c9c9de;}
@media (max-height:760px){
.ts-caption,.ts-helper-text{display:none;}
.ts-rail{gap:4px;}
.ts-mini-readout{padding:2px 6px;}
.ts-m-block{padding:4px 6px;}
.ts-eyebrow{font-size:9px;}
.ts-val{font-size:12px;margin-top:1px;}
.ts-panel-header-row{margin-bottom:2px;}
.ts-m-input-row{margin-bottom:0;}
.ts-m-input-box input,.ts-m-input-box span{padding:3px 6px;}
.ts-interval-box input,.ts-interval-box span{padding:3px 6px;}
.ts-rail-divider{margin:0;}
.ts-jump-btn.wide,.ts-shrink-btn.wide{padding:3px 8px;margin-top:3px;font-size:9.5px;}
.ts-fake-slider{margin-top:4px;}
.ts-interval-row{margin-top:4px;}
.ts-fn-row{margin-bottom:4px;}
.ts-fn-prefix span,.ts-fake-input{padding:4px 8px;}
.ts-preset-pill{padding:3px 10px;}
.ts-poly-box{padding:6px 12px;min-height:0;}
.ts-n-hero{padding:8px 14px;margin-top:6px;}
.ts-n-top{margin-bottom:4px;}
}
`;


export default TaylorSeriesApplet;
