// Curve Sketching Studio — decompiled from compiled bundle for handoff (see spec.md)
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createRoot } from "react-dom/client";

var VB_W = 560;
var VB_H = 380;
var BEND_WIDTH = 0.35;
var NL_LEFT = 10;
var NL_RIGHT = 290;
function fBaseline(x) {
  return x ** 3 - 3 * x;
}
function fFaker(x) {
  return 3 * x ** 5 - 20 * x ** 3;
}
function fGap(x) {
  return (x * x - 1) / (x * x - 4);
}
function fImpostor(x) {
  return 0.6 * x ** 5 + x ** 4 - 16 * x ** 3 - 72 * x ** 2 - 2160 * x;
}
function fCorner(x) {
  return x <= 0 ? x ** 3 + 6 * x ** 2 + 13 * x - 41 / 4 : x - 4 + 25 / (x - 4);
}
function hermiteEval(x, x0, y0, m0, x1, y1, m1) {
  const h = x1 - x0;
  const t = (x - x0) / h;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
  const h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2;
  const h11 = t ** 3 - t ** 2;
  return h00 * y0 + h10 * h * m0 + h01 * y1 + h11 * h * m1;
}
var CAP_K = 1.2;
var CAP_YMAX = 6;
var CAP_XLEFT_CROSS =
  -1 + (CAP_YMAX - Math.sqrt(CAP_YMAX * CAP_YMAX + 4 * CAP_K)) / (2 * CAP_K);
var CAP_XRIGHT_START = -0.84;
var CAP_M0_NEAR = (2 * (-1 - CAP_YMAX)) / (0 - CAP_XRIGHT_START);
function fCapstone(x) {
  if (x < -1) return -1 / (x + 1) + CAP_K * (x + 1);
  if (x <= 0)
    return hermiteEval(x, CAP_XRIGHT_START, CAP_YMAX, CAP_M0_NEAR, 0, -1, 0);
  if (x <= 1) return hermiteEval(x, 0, -1, 0, 1, 0.5, 2.25);
  if (x <= 2) return hermiteEval(x, 1, 0.5, 2.25, 2, 2, 0);
  if (x <= 3) return hermiteEval(x, 2, 2, 0, 3, 0, -3.5);
  if (x <= 4) return hermiteEval(x, 3, 0, 3.2, 4, 1.5, 0);
  return hermiteEval(x, 4, 1.5, 0, 6, -1, -2.5);
}
var SQRT2 = Math.sqrt(2);
var TIERS = [
  {
    key: "baseline",
    name: "Baseline",
    skill: "clean max/min/inflection",
    ready: true,
    domainBreaks: [],
    xmin: -2.3,
    xmax: 2.3,
    ymin: -5.6,
    ymax: 5.6,
    f: fBaseline,
    skeletonCorners: [
      {
        x: -2.3,
        y: fBaseline(-2.3),
      },
      {
        x: -1,
        y: fBaseline(-1),
      },
      {
        x: 1,
        y: fBaseline(1),
      },
      {
        x: 2.3,
        y: fBaseline(2.3),
      },
    ],
    // Points participating in the sync system. `pass` says which curtain
    // reveals it (1 = first-derivative pass, 2 = second-derivative pass).
    points: [
      {
        key: "localmax",
        x: -1,
        y: fBaseline(-1),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 90,
        tickLabel: "\u22121",
      },
      {
        key: "inflection",
        x: 0,
        y: fBaseline(0),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: 35,
        tickCx: 140,
        tickLabel: "0",
      },
      {
        key: "localmin",
        x: 1,
        y: fBaseline(1),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Min",
        labelDx: 0,
        labelDy: 40,
        tickCx: 190,
        tickLabel: "1",
      },
    ],
    pass1Intervals: [
      {
        from: -2.3,
        to: -1,
        sign: "+",
      },
      {
        from: -1,
        to: 1,
        sign: "\u2212",
      },
      {
        from: 1,
        to: 2.3,
        sign: "+",
      },
    ],
    pass2Intervals: [
      {
        from: -2.3,
        to: 0,
        sign: "\u2212",
      },
      {
        from: 0,
        to: 2.3,
        sign: "+",
      },
    ],
    pass1Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 140,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 240,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    pass2Signs: [
      {
        x: 70,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 215,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    increasing: "(\u2212\u221E, \u22121) \u222A (1, \u221E)",
    decreasing: "(\u22121, 1)",
    concaveUp: "(0, \u221E)",
    concaveDown: "(\u2212\u221E, 0)",
  },
  {
    key: "faker",
    name: "Faker",
    skill: "false crit. point",
    ready: true,
    domainBreaks: [],
    xmin: -2.6,
    xmax: 2.6,
    ymin: -78,
    ymax: 78,
    f: fFaker,
    // Pass-1 sign only changes at the two REAL critical points (\u00b12); the
    // false-alarm point at x=0 sits inside one continuous decreasing
    // interval, so it is not a skeleton corner.
    skeletonCorners: [
      {
        x: -2.6,
        y: fFaker(-2.6),
      },
      {
        x: -2,
        y: fFaker(-2),
      },
      {
        x: 2,
        y: fFaker(2),
      },
      {
        x: 2.6,
        y: fFaker(2.6),
      },
    ],
    points: [
      {
        key: "localmax",
        x: -2,
        y: fFaker(-2),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 80,
        tickLabel: "\u22122",
      },
      {
        key: "falsecrit",
        x: 0,
        y: fFaker(0),
        pass: 1,
        falseAlarm: true,
        flashColor: "#8A8AA3",
        label: "Critical Point \u2014 Not an Extremum",
        labelDx: 0,
        labelDy: -34,
        tickCx: 150,
        tickLabel: "0",
      },
      {
        key: "localmin",
        x: 2,
        y: fFaker(2),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Min",
        labelDx: 0,
        labelDy: 40,
        tickCx: 220,
        tickLabel: "2",
      },
      {
        key: "inflLeft",
        x: -SQRT2,
        y: fFaker(-SQRT2),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: -30,
        tickCx: 80,
        tickLabel: "\u2212\u221A2",
      },
      {
        key: "inflZero",
        x: 0,
        y: fFaker(0),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: 40,
        tickCx: 150,
        tickLabel: "0",
      },
      {
        key: "inflRight",
        x: SQRT2,
        y: fFaker(SQRT2),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: 40,
        tickCx: 220,
        tickLabel: "\u221A2",
      },
    ],
    pass1Intervals: [
      {
        from: -2.6,
        to: -2,
        sign: "+",
      },
      {
        from: -2,
        to: 2,
        sign: "\u2212",
      },
      {
        from: 2,
        to: 2.6,
        sign: "+",
      },
    ],
    pass2Intervals: [
      {
        from: -2.6,
        to: -SQRT2,
        sign: "\u2212",
      },
      {
        from: -SQRT2,
        to: 0,
        sign: "+",
      },
      {
        from: 0,
        to: SQRT2,
        sign: "\u2212",
      },
      {
        from: SQRT2,
        to: 2.6,
        sign: "+",
      },
    ],
    pass1Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 150,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    pass2Signs: [
      {
        x: 45,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 115,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 185,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    increasing: "(\u2212\u221E, \u22122) \u222A (2, \u221E)",
    decreasing: "(\u22122, 2)",
    concaveUp: "(\u2212\u221A2, 0) \u222A (\u221A2, \u221E)",
    concaveDown: "(\u2212\u221E, \u2212\u221A2) \u222A (0, \u221A2)",
  },
  {
    key: "impostor",
    name: "Impostor",
    skill: "false inflection point",
    ready: true,
    domainBreaks: [],
    xmin: -8.5,
    xmax: 8.5,
    ymin: -14e3,
    ymax: 11500,
    f: fImpostor,
    // Only two real critical points (x=\u00b16) \u2014 the cubic factor
    // (3x\u00b2+4x+60) in f' has negative discriminant, so no other real roots.
    skeletonCorners: [
      {
        x: -8.5,
        y: fImpostor(-8.5),
      },
      {
        x: -6,
        y: fImpostor(-6),
      },
      {
        x: 6,
        y: fImpostor(6),
      },
      {
        x: 8.5,
        y: fImpostor(8.5),
      },
    ],
    points: [
      {
        key: "localmax",
        x: -6,
        y: fImpostor(-6),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 90,
        tickLabel: "\u22126",
      },
      {
        key: "falseinfl",
        x: -2,
        y: fImpostor(-2),
        pass: 2,
        falseAlarm: true,
        flashColor: "#8A8AA3",
        label: "Inflection Point \u2014 No Concavity Change",
        labelDx: 0,
        labelDy: -30,
        tickCx: 90,
        tickLabel: "\u22122",
      },
      {
        key: "realinfl",
        x: 3,
        y: fImpostor(3),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: 40,
        tickCx: 190,
        tickLabel: "3",
      },
      {
        key: "localmin",
        x: 6,
        y: fImpostor(6),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Min",
        labelDx: 0,
        labelDy: 40,
        tickCx: 190,
        tickLabel: "6",
      },
    ],
    pass1Intervals: [
      {
        from: -8.5,
        to: -6,
        sign: "+",
      },
      {
        from: -6,
        to: 6,
        sign: "\u2212",
      },
      {
        from: 6,
        to: 8.5,
        sign: "+",
      },
    ],
    // Only x=3 is a real sign-change boundary; x=-2 sits inside the (-\u221E,3)
    // interval without splitting it (same sign on both sides -> false alarm).
    pass2Intervals: [
      {
        from: -8.5,
        to: 3,
        sign: "\u2212",
      },
      {
        from: 3,
        to: 8.5,
        sign: "+",
      },
    ],
    pass1Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 140,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 240,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    pass2Signs: [
      {
        x: 50,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 140,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 240,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    increasing: "(\u2212\u221E, \u22126) \u222A (6, \u221E)",
    decreasing: "(\u22126, 6)",
    concaveUp: "(3, \u221E)",
    concaveDown: "(\u2212\u221E, 3)",
  },
  {
    key: "thegap",
    name: "The Gap",
    skill: "two asymptotes",
    ready: true,
    xmin: -5,
    xmax: 5,
    ymin: -8,
    ymax: 8,
    f: fGap,
    // Three disconnected domain pieces, separated by vertical asymptotes at
    // x=\u00b12. Piece boundaries near each asymptote are the EXACT x-values
    // where the true function crosses the Y clip boundary (solved from
    // (x\u00b2-1)/(x\u00b2-4)=Y), not an arbitrary small buffer \u2014 a fixed buffer left
    // a faint flatlined plateau against the ceiling/floor before the true
    // descent kicked in (same bug Kyle caught more visibly on Corner).
    domainPieces: [
      {
        xStart: -5,
        xEnd: -Math.sqrt(31 / 7),
        corners: [
          {
            x: -5,
            y: fGap(-5),
          },
          {
            x: -Math.sqrt(31 / 7),
            y: 8,
          },
        ],
      },
      {
        xStart: -Math.sqrt(11 / 3),
        xEnd: Math.sqrt(11 / 3),
        corners: [
          {
            x: -Math.sqrt(11 / 3),
            y: -8,
          },
          {
            x: 0,
            y: fGap(0),
          },
          {
            x: Math.sqrt(11 / 3),
            y: -8,
          },
        ],
      },
      {
        xStart: Math.sqrt(31 / 7),
        xEnd: 5,
        corners: [
          {
            x: Math.sqrt(31 / 7),
            y: 8,
          },
          {
            x: 5,
            y: fGap(5),
          },
        ],
      },
    ],
    domainBreaks: [
      {
        key: "breakNeg2",
        x: -2,
        label: "x \u2260 \u22122 (vertical asymptote)",
        tickCx: 80,
        tickLabel: "\u22122",
      },
      {
        key: "break2",
        x: 2,
        label: "x \u2260 2 (vertical asymptote)",
        tickCx: 220,
        tickLabel: "2",
      },
    ],
    // Only one real critical point (x=0). f'' is never zero anywhere in the
    // domain \u2014 the sign of f'' does flip at x=\u00b12, but since neither point is
    // in the domain, neither counts as a real inflection point. Zero pass-2
    // points, by design.
    points: [
      {
        key: "localmax",
        x: 0,
        y: fGap(0),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 150,
        tickLabel: "0",
      },
    ],
    pass1Intervals: [
      {
        from: -5,
        to: -2,
        sign: "+",
      },
      {
        from: -2,
        to: 0,
        sign: "+",
      },
      {
        from: 0,
        to: 2,
        sign: "\u2212",
      },
      {
        from: 2,
        to: 5,
        sign: "\u2212",
      },
    ],
    pass2Intervals: [
      {
        from: -5,
        to: -2,
        sign: "+",
      },
      {
        from: -2,
        to: 2,
        sign: "\u2212",
      },
      {
        from: 2,
        to: 5,
        sign: "+",
      },
    ],
    pass1Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 115,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 185,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "\u2212",
        color: "#C77B94",
      },
    ],
    pass2Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 150,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    increasing: "(\u2212\u221E, \u22122) \u222A (\u22122, 0)",
    decreasing: "(0, 2) \u222A (2, \u221E)",
    concaveUp: "(\u2212\u221E, \u22122) \u222A (2, \u221E)",
    concaveDown: "(\u22122, 2)",
  },
  {
    key: "corner",
    name: "Corner",
    skill: "non-diff. seam",
    ready: true,
    xmin: -4,
    xmax: 12.5,
    ymin: -31,
    ymax: 22,
    f: fCorner,
    // One true domain break (vertical asymptote at x=4). The seam at x=0 is
    // NOT a domain break \u2014 the piecewise function is continuous there, just
    // non-differentiable, so it stays inside piece A as an ordinary (if
    // sharp) skeleton corner rather than needing its own gap/buffer.
    // Piece boundaries near x=4 are the EXACT x-values where the true
    // function crosses the Y clip boundary (solved from (x-4)+25/(x-4)=Y),
    // not an arbitrary small buffer \u2014 a fixed buffer left the curve
    // flatlined against the ceiling/floor for a visible stretch, since the
    // true value stays clamped there for a while before actually descending.
    domainPieces: [
      {
        xStart: -4,
        xEnd: 4 + (-31 + Math.sqrt(31 * 31 - 100)) / 2,
        corners: [
          {
            x: -4,
            y: fCorner(-4),
          },
          {
            x: 0,
            y: fCorner(0),
          },
          {
            x: 4 + (-31 + Math.sqrt(31 * 31 - 100)) / 2,
            y: -31,
          },
        ],
      },
      {
        xStart: 4 + (22 - Math.sqrt(22 * 22 - 100)) / 2,
        xEnd: 12.5,
        corners: [
          {
            x: 4 + (22 - Math.sqrt(22 * 22 - 100)) / 2,
            y: 22,
          },
          {
            x: 9,
            y: fCorner(9),
          },
          {
            x: 12.5,
            y: fCorner(12.5),
          },
        ],
      },
    ],
    domainBreaks: [
      // Needs separate tick positions per number line: on pass 1's line x=4
      // is the middle of {0,4,9}, but on pass 2's line x=4 is the rightmost
      // of {-2,0,4} \u2014 a single shared position can't be evenly spaced on
      // both lines at once.
      {
        key: "break4",
        x: 4,
        label: "x \u2260 4 (vertical asymptote)",
        tickCx1: 150,
        tickCx2: 220,
        tickLabel: "4",
      },
    ],
    points: [
      {
        key: "realinfl",
        x: -2,
        y: fCorner(-2),
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: -30,
        tickCx: 80,
        tickLabel: "\u22122",
      },
      // The corner itself: a REAL local max, but the derivative is
      // undefined there (left slope 13, right slope \u22129/16 don't agree) \u2014
      // first tier where "undefined derivative" and "real extremum"
      // coincide, rather than undefined-derivative only ever marking a
      // false-alarm/cusp point. Gets a filled, colored dot like any real
      // point, but a "u" tick (undefinedDeriv) instead of a numeric one.
      {
        key: "cornermax",
        x: 0,
        y: fCorner(0),
        pass: 1,
        falseAlarm: false,
        undefinedDeriv: true,
        flashColor: "#3B4FC2",
        label: "Local Max (Corner)",
        labelDx: 0,
        labelDy: -30,
        tickCx: 80,
        tickLabel: "0",
      },
      // Concavity genuinely differs on either side of the seam (concave up
      // on (-2,0), concave down on (0,4)) even though f'' is undefined
      // exactly at x=0 \u2014 same "real point, undefined derivative" pattern as
      // the corner's own pass-1 marker above, just for the second
      // derivative. Coincides on the graph with cornermax (same x,y), so
      // clicking that point shows both labels stacked.
      {
        key: "cornerconcavity",
        x: 0,
        y: fCorner(0),
        pass: 2,
        falseAlarm: false,
        undefinedDeriv: true,
        flashColor: "#6478D6",
        label: "Concavity Change (Corner)",
        labelDx: 0,
        labelDy: 40,
        tickCx: 150,
        tickLabel: "0",
      },
      {
        key: "realmin",
        x: 9,
        y: fCorner(9),
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Min",
        labelDx: 0,
        labelDy: 40,
        tickCx: 220,
        tickLabel: "9",
      },
    ],
    pass1Intervals: [
      {
        from: -4,
        to: 0,
        sign: "+",
      },
      {
        from: 0,
        to: 4,
        sign: "\u2212",
      },
      {
        from: 4,
        to: 9,
        sign: "\u2212",
      },
      {
        from: 9,
        to: 12.5,
        sign: "+",
      },
    ],
    pass2Intervals: [
      {
        from: -4,
        to: -2,
        sign: "\u2212",
      },
      {
        from: -2,
        to: 0,
        sign: "+",
      },
      {
        from: 0,
        to: 4,
        sign: "\u2212",
      },
      {
        from: 4,
        to: 12.5,
        sign: "+",
      },
    ],
    pass1Signs: [
      {
        x: 45,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 115,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 185,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    pass2Signs: [
      {
        x: 45,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 115,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 185,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 255,
        sign: "+",
        color: "#3B4FC2",
      },
    ],
    increasing: "(\u2212\u221E, 0) \u222A (9, \u221E)",
    decreasing: "(0, 4) \u222A (4, 9)",
    concaveUp: "(\u22122, 0) \u222A (4, \u221E)",
    concaveDown: "(\u2212\u221E, \u22122) \u222A (0, 4)",
  },
  {
    key: "freehand",
    name: "Capstone",
    skill: "many skills, one curve",
    ready: true,
    xmin: -2,
    xmax: 6,
    ymin: -2.5,
    ymax: 6,
    f: fCapstone,
    domainPieces: [
      {
        xStart: -2,
        xEnd: CAP_XLEFT_CROSS,
        corners: [
          {
            x: -2,
            y: fCapstone(-2),
          },
          {
            x: CAP_XLEFT_CROSS,
            y: CAP_YMAX,
          },
        ],
      },
      {
        xStart: CAP_XRIGHT_START,
        xEnd: 6,
        corners: [
          {
            x: CAP_XRIGHT_START,
            y: CAP_YMAX,
          },
          {
            x: 0,
            y: -1,
          },
          {
            x: 2,
            y: 2,
          },
          {
            x: 3,
            y: 0,
          },
          {
            x: 4,
            y: 1.5,
          },
          {
            x: 6,
            y: fCapstone(6),
          },
        ],
      },
    ],
    domainBreaks: [
      {
        key: "breakNeg1",
        x: -1,
        label: "x \u2260 \u22121 (vertical asymptote)",
        tickCx1: 57,
        tickCx2: 103,
        tickLabel: "\u22121",
      },
    ],
    points: [
      {
        key: "min",
        x: 0,
        y: -1,
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Min",
        labelDx: 0,
        labelDy: 40,
        tickCx: 103,
        tickLabel: "0",
      },
      {
        key: "realinfl",
        x: 1,
        y: 0.5,
        pass: 2,
        falseAlarm: false,
        flashColor: "#6478D6",
        label: "Inflection Point",
        labelDx: 0,
        labelDy: -30,
        tickCx: 197,
        tickLabel: "1",
      },
      {
        key: "max1",
        x: 2,
        y: 2,
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 150,
        tickLabel: "2",
      },
      // Cusp min: a REAL local min (decreasing into it, increasing out) but
      // the derivative is undefined there \u2014 same "real point, undefined
      // derivative" pattern as Corner's own cusp.
      {
        key: "cuspmin",
        x: 3,
        y: 0,
        pass: 1,
        falseAlarm: false,
        undefinedDeriv: true,
        flashColor: "#3B4FC2",
        label: "Local Min (Cusp)",
        labelDx: 0,
        labelDy: 40,
        tickCx: 197,
        tickLabel: "3",
      },
      {
        key: "max2",
        x: 4,
        y: 1.5,
        pass: 1,
        falseAlarm: false,
        flashColor: "#3B4FC2",
        label: "Local Max",
        labelDx: 0,
        labelDy: -30,
        tickCx: 243,
        tickLabel: "4",
      },
    ],
    pass1Intervals: [
      {
        from: -2,
        to: -1,
        sign: "+",
      },
      {
        from: -1,
        to: 0,
        sign: "\u2212",
      },
      {
        from: 0,
        to: 2,
        sign: "+",
      },
      {
        from: 2,
        to: 3,
        sign: "\u2212",
      },
      {
        from: 3,
        to: 4,
        sign: "+",
      },
      {
        from: 4,
        to: 6,
        sign: "\u2212",
      },
    ],
    // Concavity stays positive on BOTH sides of the asymptote (per design:
    // "concave up on either side of the vertical asymptote") \u2014 the break
    // still splits the interval (matching how domain breaks are always
    // treated elsewhere), it just doesn't happen to change the sign here.
    pass2Intervals: [
      {
        from: -2,
        to: -1,
        sign: "+",
      },
      {
        from: -1,
        to: 1,
        sign: "+",
      },
      {
        from: 1,
        to: 6,
        sign: "\u2212",
      },
    ],
    pass1Signs: [
      {
        x: 33,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 80,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 126,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 173,
        sign: "\u2212",
        color: "#C77B94",
      },
      {
        x: 220,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 266,
        sign: "\u2212",
        color: "#C77B94",
      },
    ],
    pass2Signs: [
      {
        x: 56,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 150,
        sign: "+",
        color: "#3B4FC2",
      },
      {
        x: 243,
        sign: "\u2212",
        color: "#C77B94",
      },
    ],
    increasing: "(\u22122, \u22121) \u222A (0, 2) \u222A (3, 4)",
    decreasing: "(\u22121, 0) \u222A (2, 3) \u222A (4, 6)",
    concaveUp: "(\u22122, \u22121) \u222A (\u22121, 1)",
    concaveDown: "(1, 6)",
  },
];
function xPix(x, xmin, xmax) {
  return ((x - xmin) / (xmax - xmin)) * VB_W;
}
function yPix(y, ymin, ymax) {
  const marginTop = 20,
    marginBottom = 20;
  return (
    marginTop + ((ymax - y) / (ymax - ymin)) * (VB_H - marginTop - marginBottom)
  );
}
function boundaryPixel(tier, x, forPass) {
  if (x === tier.xmin) return NL_LEFT;
  if (x === tier.xmax) return NL_RIGHT;
  const ptSamePass = tier.points.find((p) => p.x === x && p.pass === forPass);
  if (ptSamePass) return ptSamePass.tickCx;
  const pt = tier.points.find((p) => p.x === x);
  if (pt) return pt.tickCx;
  const brk = (tier.domainBreaks || []).find((b) => b.x === x);
  if (brk) {
    if (forPass === 1 && brk.tickCx1 !== void 0) return brk.tickCx1;
    if (forPass === 2 && brk.tickCx2 !== void 0) return brk.tickCx2;
    return brk.tickCx;
  }
  return NL_LEFT;
}
function renderSqrtHtml(str) {
  const parts = str.split(/(\u221A\d)/g);
  return parts.map((part, i) => {
    if (part.length === 2 && part[0] === "\u221A") {
      return (
        <Fragment key={i}>
          √
          <span
            style={{
              textDecoration: "overline",
            }}
          >
            {part[1]}
          </span>
        </Fragment>
      );
    }
    return part;
  });
}
function renderSqrtSvg(str) {
  const parts = str.split(/(\u221A\d)/g);
  return parts.map((part, i) => {
    if (part.length === 2 && part[0] === "\u221A") {
      return (
        <tspan key={i}>
          √
          <tspan
            style={{
              textDecoration: "overline",
            }}
          >
            {part[1]}
          </tspan>
        </tspan>
      );
    }
    return <tspan key={i}>{part}</tspan>;
  });
}
function interpFromCorners(corners, x) {
  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i],
      b = corners[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
  }
  return corners[corners.length - 1].y;
}
function skeletonYAt(tier, x) {
  if (tier.domainPieces) {
    const piece = tier.domainPieces.find(
      (pc) => x >= pc.xStart && x <= pc.xEnd,
    );
    return piece ? interpFromCorners(piece.corners, x) : 0;
  }
  return interpFromCorners(tier.skeletonCorners, x);
}
function currentInterval(intervals, x) {
  if (x <= intervals[0].from + 1e-9) return null;
  for (const iv of intervals) {
    if (x > iv.from && x <= iv.to + 1e-9) return iv;
  }
  return intervals[intervals.length - 1];
}
var SPEED_OPTIONS = [0.25, 0.5, 1];
var PASS_DURATION_MS = 4200;
var PAUSE_BASE_MS = 1e3;
function App() {
  const [tierIndex, setTierIndex] = (0, useState)(0);
  const tabRefs = (0, useRef)([]);
  const [thumbBox, setThumbBox] = (0, useState)(null);
  const tier = TIERS[tierIndex];
  const [pass1Progress, setPass1Progress] = (0, useState)(0);
  const [pass2Progress, setPass2Progress] = (0, useState)(0);
  const [playing, setPlaying] = (0, useState)(null);
  const [speed, setSpeed] = (0, useState)(1);
  const [revealedInstantly, setRevealedInstantly] = (0, useState)(false);
  const [reviewPulse, setReviewPulse] = (0, useState)({});
  const [labelState, setLabelState] = (0, useState)({});
  const rafRef = (0, useRef)(null);
  const pauseTimeoutRef = (0, useRef)(null);
  const startRef = (0, useRef)(0);
  const fromRef = (0, useRef)(0);
  const labelTimeoutsRef = (0, useRef)({});
  const pausedAtRef = (0, useRef)(/* @__PURE__ */ new Set());
  const XMIN = tier.xmin,
    XMAX = tier.xmax,
    YMIN = tier.ymin,
    YMAX = tier.ymax;
  const axisY = yPix(0, YMIN, YMAX);
  const pass1X = XMIN + (XMAX - XMIN) * pass1Progress;
  const pass2X = XMIN + (XMAX - XMIN) * pass2Progress;
  const pass1Done = pass1Progress >= 1;
  const pass2Done = pass2Progress >= 1;
  const LABEL_HOLD_MS = 2e3;
  const LABEL_FADE_MS = 300;
  function flashLabel(key) {
    const existing = labelTimeoutsRef.current[key];
    if (existing) {
      clearTimeout(existing.fadeTimer);
      clearTimeout(existing.removeTimer);
    }
    setLabelState((prev) => ({
      ...prev,
      [key]: "shown",
    }));
    const fadeTimer = setTimeout(() => {
      setLabelState((prev) => ({
        ...prev,
        [key]: "fading",
      }));
    }, LABEL_HOLD_MS);
    const removeTimer = setTimeout(() => {
      setLabelState((prev) => {
        const next = {
          ...prev,
        };
        delete next[key];
        return next;
      });
    }, LABEL_HOLD_MS + LABEL_FADE_MS);
    labelTimeoutsRef.current[key] = {
      fadeTimer,
      removeTimer,
    };
  }
  function clearAllLabelTimers() {
    Object.values(labelTimeoutsRef.current).forEach(
      ({ fadeTimer, removeTimer }) => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      },
    );
    labelTimeoutsRef.current = {};
    setLabelState({});
  }
  function triggerReview(key) {
    setReviewPulse((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
    flashLabel(key);
  }
  function keyPointsForPass(which) {
    return tier.points
      .filter((p) => p.pass === which)
      .concat(tier.domainBreaks || []);
  }
  const stepAnim = (0, useCallback)(
    (which, setter, ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const effectiveDuration = PASS_DURATION_MS / speed;
      let t = Math.min(1, fromRef.current + elapsed / effectiveDuration);
      const pts = keyPointsForPass(which);
      let hitKey = null;
      for (const p of pts) {
        const kp = (p.x - XMIN) / (XMAX - XMIN);
        if (
          !pausedAtRef.current.has(p.key) &&
          fromRef.current < kp &&
          t >= kp
        ) {
          hitKey = p;
          t = kp;
          break;
        }
      }
      setter(t);
      if (hitKey) {
        pausedAtRef.current.add(hitKey.key);
        flashLabel(hitKey.key);
        cancelAnimationFrame(rafRef.current);
        const dwell = PAUSE_BASE_MS;
        pauseTimeoutRef.current = setTimeout(() => {
          fromRef.current = t;
          startRef.current = 0;
          rafRef.current = requestAnimationFrame((ts2) =>
            stepAnim(which, setter, ts2),
          );
        }, dwell);
        return;
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame((ts2) =>
          stepAnim(which, setter, ts2),
        );
      } else {
        startRef.current = 0;
        if (which === 1) {
          pauseTimeoutRef.current = setTimeout(() => playFrom(2), 250);
        } else {
          setPlaying(null);
        }
      }
    },
    [speed, tier],
  );
  function playFrom(which) {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    startRef.current = 0;
    if (which === 1) {
      const restarting = pass1Progress >= 1;
      fromRef.current = restarting ? 0 : pass1Progress;
      if (restarting) {
        setPass1Progress(0);
        setPass2Progress(0);
        pausedAtRef.current = /* @__PURE__ */ new Set();
      }
      setPlaying(1);
      rafRef.current = requestAnimationFrame((ts) =>
        stepAnim(1, setPass1Progress, ts),
      );
    } else {
      fromRef.current = pass2Progress >= 1 ? 0 : pass2Progress;
      if (pass2Progress >= 1) setPass2Progress(0);
      setPlaying(2);
      rafRef.current = requestAnimationFrame((ts) =>
        stepAnim(2, setPass2Progress, ts),
      );
    }
  }
  function handlePlayClick() {
    if (playing) {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(pauseTimeoutRef.current);
      setPlaying(null);
      return;
    }
    setRevealedInstantly(false);
    if (!pass1Done) playFrom(1);
    else if (!pass2Done) playFrom(2);
    else playFrom(1);
  }
  function handleReset() {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    startRef.current = 0;
    fromRef.current = 0;
    pausedAtRef.current = /* @__PURE__ */ new Set();
    clearAllLabelTimers();
    setPlaying(null);
    setRevealedInstantly(false);
    setPass1Progress(0);
    setPass2Progress(0);
  }
  function handleReveal() {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    startRef.current = 0;
    pausedAtRef.current = new Set(tier.points.map((p) => p.key));
    clearAllLabelTimers();
    setPlaying(null);
    setRevealedInstantly(true);
    setPass1Progress(1);
    setPass2Progress(1);
  }
  function handlePass1Slider(e) {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    setPlaying(null);
    setRevealedInstantly(false);
    const v = parseFloat(e.target.value);
    setPass1Progress(v);
    if (v < 1) setPass2Progress(0);
  }
  function handlePass2Slider(e) {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    setPlaying(null);
    setRevealedInstantly(false);
    setPass2Progress(parseFloat(e.target.value));
  }
  (0, useEffect)(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(pauseTimeoutRef.current);
      Object.values(labelTimeoutsRef.current).forEach((id) => clearTimeout(id));
    },
    [],
  );
  function selectTier(i) {
    if (!TIERS[i].ready) return;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(pauseTimeoutRef.current);
    clearAllLabelTimers();
    pausedAtRef.current = /* @__PURE__ */ new Set();
    setTierIndex(i);
    setPass1Progress(0);
    setPass2Progress(0);
    setPlaying(null);
    setRevealedInstantly(false);
    setReviewPulse({});
  }
  function pointRevealed(p) {
    return p.pass === 1 ? pass1X >= p.x - 1e-6 : pass2X >= p.x - 1e-6;
  }
  function buildPath() {
    const SAMPLE_N = 240;
    let d = "";
    function bendAt(x) {
      if (pass2Done) return 1;
      if (pass2X > XMIN)
        return Math.max(0, Math.min(1, (pass2X - x) / BEND_WIDTH));
      return 0;
    }
    if (tier.domainPieces) {
      for (const piece of tier.domainPieces) {
        if (piece.xStart > pass1X + 1e-9) break;
        let started2 = false;
        const pieceEnd = Math.min(piece.xEnd, pass1X);
        for (let i = 0; i <= SAMPLE_N; i++) {
          const x = piece.xStart + ((piece.xEnd - piece.xStart) * i) / SAMPLE_N;
          if (x > pieceEnd + 1e-9) break;
          const skelY = skeletonYAt(tier, x);
          const bendT = bendAt(x);
          const trueYRaw = tier.f(x);
          const trueY = Math.max(YMIN, Math.min(YMAX, trueYRaw));
          const blendedY = skelY + (trueY - skelY) * bendT;
          const px = xPix(x, XMIN, XMAX),
            py = yPix(blendedY, YMIN, YMAX);
          d += (started2 ? "L " : "M ") + px + " " + py + " ";
          started2 = true;
        }
      }
      return d;
    }
    let started = false;
    for (let i = 0; i <= SAMPLE_N; i++) {
      const x = XMIN + ((XMAX - XMIN) * i) / SAMPLE_N;
      if (x > pass1X + 1e-9) break;
      const skelY = skeletonYAt(tier, x);
      const bendT = bendAt(x);
      const trueY = tier.f(x);
      const blendedY = skelY + (trueY - skelY) * bendT;
      const px = xPix(x, XMIN, XMAX),
        py = yPix(blendedY, YMIN, YMAX);
      d += (started ? "L " : "M ") + px + " " + py + " ";
      started = true;
    }
    return d;
  }
  const curvePath = buildPath();
  const activeInterval1 =
    pass1Progress > 0 && !pass1Done
      ? currentInterval(tier.pass1Intervals, pass1X)
      : null;
  const activeInterval2 =
    pass2Progress > 0 && !pass2Done
      ? currentInterval(tier.pass2Intervals, pass2X)
      : null;
  (0, useEffect)(() => {
    const el = tabRefs.current[tierIndex];
    if (el) {
      setThumbBox({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  }, [tierIndex]);
  return (
    <div className="page">
      <div className="header-card">
        <div className="banner">
          <div className="banner-text">
            <div className="kicker">CALCULUS 1 · CURVE SKETCHING</div>
            <h1>Curve Sketching Studio</h1>
            <p className="tagline">
              Let's use information from the 1st and 2nd derivatives to build a
              possible sketch of the function.
            </p>
          </div>
          <div className="tab-pill-group">
            {thumbBox && (
              <div
                className="tab-thumb"
                style={{
                  left: thumbBox.left,
                  top: thumbBox.top,
                  width: thumbBox.width,
                  height: thumbBox.height,
                }}
              />
            )}
            {TIERS.map((t, i) => (
              <button
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                className={
                  "tab-pill-btn" +
                  (i === tierIndex ? " active" : "") +
                  (!t.ready ? " disabled" : "")
                }
                onClick={() => selectTier(i)}
                key={t.key}
              >
                <div className="name">{t.name}</div>
                <div className="skill">
                  {t.ready ? t.skill : t.skill + " \u2014 coming soon"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="main-grid">
        <div className="graph-card">
          {!playing && pass1Progress === 0 && !revealedInstantly && (
            <div className="instruction-text">
              Click <b>Play</b> to reveal how the first derivative shapes this
              curve
            </div>
          )}
          <svg className="graph" viewBox={`0 0 ${VB_W} ${VB_H}`}>
            <g stroke="#EFEFF7" strokeWidth="1">
              {[38, 76, 114, 152, 228, 266, 304, 342].map((y) => (
                <line x1="0" y1={y} x2={VB_W} y2={y} key={y} />
              ))}
              {[70, 140, 210, 350, 420, 490].map((x) => (
                <line x1={x} y1="0" x2={x} y2={VB_H} key={x} />
              ))}
            </g>
            {activeInterval1 && (
              <g>
                <rect
                  x={xPix(Math.max(activeInterval1.from, XMIN), XMIN, XMAX)}
                  y={axisY - 4}
                  width={
                    xPix(Math.min(activeInterval1.to, XMAX), XMIN, XMAX) -
                    xPix(Math.max(activeInterval1.from, XMIN), XMIN, XMAX)
                  }
                  height="8"
                  fill="#3FA66A"
                  opacity="0.18"
                />
                <line
                  x1={xPix(Math.max(activeInterval1.from, XMIN), XMIN, XMAX)}
                  y1={axisY}
                  x2={xPix(Math.min(activeInterval1.to, XMAX), XMIN, XMAX)}
                  y2={axisY}
                  stroke="#3FA66A"
                  strokeWidth="3"
                />
              </g>
            )}
            {activeInterval2 && (
              <g>
                <rect
                  x={xPix(Math.max(activeInterval2.from, XMIN), XMIN, XMAX)}
                  y={axisY - 4}
                  width={
                    xPix(Math.min(activeInterval2.to, XMAX), XMIN, XMAX) -
                    xPix(Math.max(activeInterval2.from, XMIN), XMIN, XMAX)
                  }
                  height="8"
                  fill="#3FA66A"
                  opacity="0.18"
                />
                <line
                  x1={xPix(Math.max(activeInterval2.from, XMIN), XMIN, XMAX)}
                  y1={axisY}
                  x2={xPix(Math.min(activeInterval2.to, XMAX), XMIN, XMAX)}
                  y2={axisY}
                  stroke="#3FA66A"
                  strokeWidth="3"
                />
              </g>
            )}
            <line
              x1="0"
              y1={axisY}
              x2={VB_W}
              y2={axisY}
              stroke="#B9B9D6"
              strokeWidth="1.5"
            />
            <line
              x1={xPix(0, XMIN, XMAX)}
              y1="0"
              x2={xPix(0, XMIN, XMAX)}
              y2={VB_H}
              stroke="#B9B9D6"
              strokeWidth="1.5"
            />
            {(tier.domainBreaks || []).map((b) => {
              const bx = xPix(b.x, XMIN, XMAX);
              const st = labelState[b.key];
              const pulsed = st === "shown" || st === "fading";
              return (
                <Fragment key={b.key}>
                  <line
                    x1={bx}
                    y1="0"
                    x2={bx}
                    y2={VB_H}
                    stroke={pulsed ? "#3B4FC2" : "#B9B9D6"}
                    strokeWidth={pulsed ? "2.5" : "1.5"}
                    strokeDasharray="6 5"
                    style={{
                      pointerEvents: "none",
                      transition: "stroke 0.3s ease, stroke-width 0.3s ease",
                    }}
                  />{" "}
                  // Wide invisible hit-target \u2014 the visible dashed line
                  itself is // too thin (1.5-2.5px) to click reliably.
                  <line
                    x1={bx}
                    y1="0"
                    x2={bx}
                    y2={VB_H}
                    stroke="transparent"
                    strokeWidth="22"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => triggerReview(b.key)}
                  />
                </Fragment>
              );
            })}
            {curvePath && (
              <path
                d={curvePath}
                fill="none"
                stroke="#3A3A3C"
                strokeWidth="2.5"
              />
            )}
            {pass1Progress > 0 && !pass1Done && (
              <g>
                <rect
                  x={xPix(pass1X, XMIN, XMAX)}
                  y="0"
                  width="3"
                  height={VB_H}
                  fill="#3B4FC2"
                />
                <rect
                  x={xPix(pass1X, XMIN, XMAX) + 3}
                  y="0"
                  width="18"
                  height={VB_H}
                  fill="url(#curtainFade1)"
                />
              </g>
            )}
            {pass1Done && pass2Progress > 0 && !pass2Done && (
              <g>
                <rect
                  x={xPix(pass2X, XMIN, XMAX)}
                  y="0"
                  width="3"
                  height={VB_H}
                  fill="#6478D6"
                />
                <rect
                  x={xPix(pass2X, XMIN, XMAX) + 3}
                  y="0"
                  width="18"
                  height={VB_H}
                  fill="url(#curtainFade2)"
                />
              </g>
            )}
            <defs>
              <linearGradient id="curtainFade1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B4FC2" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3B4FC2" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="curtainFade2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6478D6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#6478D6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {tier.points
              .map((p) => {
                const revealed = pointRevealed(p);
                if (!revealed) return null;
                return p;
              })
              .filter(Boolean)
              .reduce((groups, p) => {
                const gkey = p.x.toFixed(6) + "," + p.y.toFixed(6);
                let grp = groups.find((g) => g.key === gkey);
                if (!grp) {
                  grp = {
                    key: gkey,
                    pts: [],
                  };
                  groups.push(grp);
                }
                grp.pts.push(p);
                return groups;
              }, [])
              .map((grp) => {
                const anyFalse = grp.pts.some((p) => p.falseAlarm);
                const anyShown = grp.pts.some((p) => {
                  const s = labelState[p.key];
                  return s === "shown" || s === "fading";
                });
                const dotColor =
                  anyFalse && grp.pts.length === 1
                    ? "#8A8AA3"
                    : anyShown
                      ? grp.pts[0].flashColor
                      : "#8A8AA3";
                const cx = xPix(grp.pts[0].x, XMIN, XMAX),
                  cy = yPix(grp.pts[0].y, YMIN, YMAX);
                const onClick = () =>
                  grp.pts.forEach((p) => triggerReview(p.key));
                const anyFreshRing = grp.pts.some(
                  (p) => labelState[p.key] === "shown",
                );
                return (
                  <g className="point-group" onClick={onClick} key={grp.key}>
                    {anyFreshRing && (
                      <>
                        <circle
                          className="ring"
                          cx={cx}
                          cy={cy}
                          r="7"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2.5"
                        />
                        <circle
                          className="ring delay"
                          cx={cx}
                          cy={cy}
                          r="7"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2.5"
                        />
                      </>
                    )}
                    <circle
                      className="dot"
                      cx={cx}
                      cy={cy}
                      r="6"
                      fill={dotColor}
                    />
                    {grp.pts.map((p) => {
                      const state = labelState[p.key];
                      const showLabel = state === "shown" || state === "fading";
                      if (!showLabel) return null;
                      const isFading = state === "fading";
                      const labelColor = p.falseAlarm
                        ? "#8A8AA3"
                        : p.flashColor;
                      const labelW = Math.max(100, p.label.length * 7 + 20);
                      return (
                        <g
                          className={
                            "label-badge" + (isFading ? " fading" : "")
                          }
                          key={p.key}
                        >
                          <line
                            x1={cx}
                            y1={cy + (p.labelDy > 0 ? 7 : -7)}
                            x2={cx}
                            y2={cy + p.labelDy}
                            stroke={labelColor}
                            strokeWidth="1.5"
                          />
                          <rect
                            x={cx + p.labelDx - labelW / 2}
                            y={cy + p.labelDy - (p.labelDy > 0 ? 14 : 28)}
                            width={labelW}
                            height="26"
                            rx="13"
                            fill={labelColor}
                          />
                          <text
                            x={cx + p.labelDx}
                            y={cy + p.labelDy - (p.labelDy > 0 ? 0 : 14) + 4}
                            fontSize="12"
                            fontWeight="700"
                            fill="white"
                            textAnchor="middle"
                          >
                            {p.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            {
              // Permanent x-value labels along the axis \u2014 revealed alongside each
              // point and never fade, unlike the floating label badges. Dedupe by
              // x so coincident points (e.g. Faker's/Corner's stacked pairs)
              // only get one tick, not two overlapping ones.
              tier.points
                .filter((p) => pointRevealed(p))
                .reduce((acc, p) => {
                  if (!acc.some((q) => q.x === p.x)) acc.push(p);
                  return acc;
                }, [])
                .map((p) => (
                  <g
                    style={{
                      pointerEvents: "none",
                    }}
                    key={p.key + "-xaxis"}
                  >
                    <line
                      x1={xPix(p.x, XMIN, XMAX)}
                      y1={axisY - 4}
                      x2={xPix(p.x, XMIN, XMAX)}
                      y2={axisY + 4}
                      stroke="#8A8AA3"
                      strokeWidth="1.5"
                    />
                    <text
                      x={xPix(p.x, XMIN, XMAX)}
                      y={axisY + 18}
                      fontSize="10.5"
                      fontStyle={p.undefinedDeriv ? "italic" : "normal"}
                      textAnchor="middle"
                      fill="#8A8AA3"
                    >
                      {renderSqrtSvg(p.tickLabel)}
                    </text>
                  </g>
                ))
            }
            {(tier.domainBreaks || []).map((b) => (
              <g
                style={{
                  pointerEvents: "none",
                }}
                key={b.key + "-xaxis"}
              >
                <line
                  x1={xPix(b.x, XMIN, XMAX)}
                  y1={axisY - 4}
                  x2={xPix(b.x, XMIN, XMAX)}
                  y2={axisY + 4}
                  stroke="#8A8AA3"
                  strokeWidth="1.5"
                />
                <text
                  x={xPix(b.x, XMIN, XMAX)}
                  y={axisY + 18}
                  fontSize="10.5"
                  fontStyle="italic"
                  textAnchor="middle"
                  fill="#8A8AA3"
                >
                  {b.tickLabel}
                </text>
              </g>
            ))}
            <text x={VB_W - 15} y={axisY - 6} fontSize="12" fill="#8A8AA3">
              x
            </text>
            <text
              x={xPix(0, XMIN, XMAX) + 6}
              y="14"
              fontSize="12"
              fill="#8A8AA3"
            >
              y
            </text>
          </svg>
          <div className="util-row">
            <div className="speed-group">
              {SPEED_OPTIONS.map((s) => (
                <div
                  className={"speed-opt" + (s === speed ? " active" : "")}
                  onClick={() => setSpeed(s)}
                  key={s}
                >
                  {s === 1 ? "1\xD7" : s === 0.5 ? "\xBD\xD7" : "\xBC\xD7"}
                </div>
              ))}
            </div>
            <button className="reveal-btn" onClick={handleReveal}>
              Reveal Graph
            </button>
          </div>
          <div className="controls-row">
            <button
              className={
                "play-btn" + (pass1Progress === 0 && !playing ? " pulsing" : "")
              }
              onClick={handlePlayClick}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              className="icon-btn"
              onClick={handleReset}
              title="Reset this example"
            >
              <ResetIcon />
            </button>
            <div className="progress-track">
              <div className="progress-labels">
                <span>1st Derivative Pass</span>
                <span>2nd Derivative Pass</span>
              </div>
              <div className="slider-row">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={pass1Progress}
                  onChange={handlePass1Slider}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={pass2Progress}
                  disabled={!pass1Done}
                  onChange={handlePass2Slider}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="panel-card">
          <div className="panel-section domain">
            <div className="panel-title">Domain Information</div>
            {tier.domainBreaks.length === 0 ? (
              <div className="domain-note">No discontinuities</div>
            ) : (
              <div className="sign-rows">
                {tier.domainBreaks.map((b) => {
                  const st = labelState[b.key];
                  const active = st === "shown" || st === "fading";
                  return (
                    <div
                      className={
                        "sign-row domain-row" + (active ? " active" : "")
                      }
                      onClick={() => triggerReview(b.key)}
                      key={b.key}
                    >
                      <span className="sign-value">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="panel-section first">
            <div className="panel-title">First Derivative Information</div>
            <svg className="number-line" viewBox="0 0 300 64">
              {tier.pass1Signs.map((s, i) => (
                <text
                  x={s.x}
                  y="16"
                  fontSize="16"
                  fontWeight="700"
                  fill={s.color}
                  textAnchor="middle"
                  key={i}
                >
                  {s.sign}
                </text>
              ))}
              {activeInterval1 && (
                <rect
                  x={boundaryPixel(tier, activeInterval1.from, 1)}
                  y="31"
                  width={
                    boundaryPixel(tier, activeInterval1.to, 1) -
                    boundaryPixel(tier, activeInterval1.from, 1)
                  }
                  height="12"
                  rx="6"
                  fill="#3FA66A"
                  opacity="0.18"
                />
              )}
              <line
                x1="10"
                y1="37"
                x2="290"
                y2="37"
                stroke="#DCDCF0"
                strokeWidth="2"
              />
              {tier.points
                .filter((p) => p.pass === 1)
                .map((p) => {
                  const revealed = pointRevealed(p);
                  if (!revealed) return null;
                  const st = labelState[p.key];
                  const active = st === "shown" || st === "fading";
                  const nlColor = p.falseAlarm
                    ? "#8A8AA3"
                    : active
                      ? p.flashColor
                      : "#8A8AA3";
                  return (
                    <g
                      className="point-group"
                      onClick={() => triggerReview(p.key)}
                      key={p.key}
                    >
                      {st === "shown" && (
                        <>
                          <circle
                            className="ring"
                            cx={p.tickCx}
                            cy="37"
                            r="6"
                            fill="none"
                            stroke={nlColor}
                            strokeWidth="2"
                          />
                          <circle
                            className="ring delay"
                            cx={p.tickCx}
                            cy="37"
                            r="6"
                            fill="none"
                            stroke={nlColor}
                            strokeWidth="2"
                          />
                        </>
                      )}
                      <circle
                        className="dot"
                        cx={p.tickCx}
                        cy="37"
                        r="5"
                        fill={nlColor}
                        style={{
                          transition: "fill 0.3s ease",
                        }}
                      />
                    </g>
                  );
                })}
              {tier.points
                .filter((p) => p.pass === 1)
                .map((p) => (
                  <text
                    x={p.tickCx - 4}
                    y="56"
                    fontSize="11"
                    fontStyle={p.undefinedDeriv ? "italic" : "normal"}
                    fill="#8A8AA3"
                    key={p.key + "lbl"}
                  >
                    {renderSqrtSvg(p.tickLabel)}
                  </text>
                ))}
              {(tier.domainBreaks || []).map((b) => {
                const cx1 = b.tickCx1 !== void 0 ? b.tickCx1 : b.tickCx;
                const bst = labelState[b.key];
                const bActive = bst === "shown" || bst === "fading";
                return (
                  <g
                    className="point-group"
                    onClick={() => triggerReview(b.key)}
                    key={b.key}
                  >
                    {bst === "shown" && (
                      <>
                        <circle
                          className="ring"
                          cx={cx1}
                          cy="37"
                          r="6"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2"
                        />
                        <circle
                          className="ring delay"
                          cx={cx1}
                          cy="37"
                          r="6"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2"
                        />
                      </>
                    )}
                    <circle
                      cx={cx1}
                      cy="37"
                      r="5"
                      fill="#FCFCFE"
                      stroke={bActive ? "#3B4FC2" : "#8A8AA3"}
                      strokeWidth="2"
                      style={{
                        transition: "stroke 0.3s ease",
                      }}
                    />
                  </g>
                );
              })}
              {(tier.domainBreaks || []).map((b) => (
                <text
                  x={(b.tickCx1 !== void 0 ? b.tickCx1 : b.tickCx) - 4}
                  y="56"
                  fontSize="11"
                  fontStyle="italic"
                  fill="#8A8AA3"
                  key={b.key + "lbl"}
                >
                  {b.tickLabel}
                </text>
              ))}
            </svg>
            <div className="sign-rows">
              <div className="sign-row">
                <span className="sign-label pos">Increasing:</span>
                <span className="sign-value">
                  {renderSqrtHtml(tier.increasing)}
                </span>
              </div>
              <div className="sign-row">
                <span className="sign-label neg">Decreasing:</span>
                <span className="sign-value">
                  {renderSqrtHtml(tier.decreasing)}
                </span>
              </div>
            </div>
          </div>
          <div className="panel-section second">
            <div className="panel-title">Second Derivative Information</div>
            <svg className="number-line" viewBox="0 0 300 64">
              {tier.pass2Signs.map((s, i) => (
                <text
                  x={s.x}
                  y="16"
                  fontSize="16"
                  fontWeight="700"
                  fill={s.color}
                  textAnchor="middle"
                  key={i}
                >
                  {s.sign}
                </text>
              ))}
              {activeInterval2 && (
                <rect
                  x={boundaryPixel(tier, activeInterval2.from, 2)}
                  y="31"
                  width={
                    boundaryPixel(tier, activeInterval2.to, 2) -
                    boundaryPixel(tier, activeInterval2.from, 2)
                  }
                  height="12"
                  rx="6"
                  fill="#3FA66A"
                  opacity="0.18"
                />
              )}
              <line
                x1="10"
                y1="37"
                x2="290"
                y2="37"
                stroke="#DCDCF0"
                strokeWidth="2"
              />
              {tier.points
                .filter((p) => p.pass === 2)
                .map((p) => {
                  const revealed = pointRevealed(p);
                  if (!revealed) return null;
                  const st = labelState[p.key];
                  const active = st === "shown" || st === "fading";
                  const nlColor = p.falseAlarm
                    ? "#8A8AA3"
                    : active
                      ? p.flashColor
                      : "#8A8AA3";
                  return (
                    <g
                      className="point-group"
                      onClick={() => triggerReview(p.key)}
                      key={p.key}
                    >
                      {st === "shown" && (
                        <>
                          <circle
                            className="ring"
                            cx={p.tickCx}
                            cy="37"
                            r="6"
                            fill="none"
                            stroke={nlColor}
                            strokeWidth="2"
                          />
                          <circle
                            className="ring delay"
                            cx={p.tickCx}
                            cy="37"
                            r="6"
                            fill="none"
                            stroke={nlColor}
                            strokeWidth="2"
                          />
                        </>
                      )}
                      <circle
                        className="dot"
                        cx={p.tickCx}
                        cy="37"
                        r="5"
                        fill={nlColor}
                        style={{
                          transition: "fill 0.3s ease",
                        }}
                      />
                    </g>
                  );
                })}
              {tier.points
                .filter((p) => p.pass === 2)
                .map((p) => (
                  <text
                    x={p.tickCx - 4}
                    y="56"
                    fontSize="11"
                    fontStyle={p.undefinedDeriv ? "italic" : "normal"}
                    fill="#8A8AA3"
                    key={p.key + "lbl"}
                  >
                    {renderSqrtSvg(p.tickLabel)}
                  </text>
                ))}
              {(tier.domainBreaks || []).map((b) => {
                const cx2 = b.tickCx2 !== void 0 ? b.tickCx2 : b.tickCx;
                const bst = labelState[b.key];
                const bActive = bst === "shown" || bst === "fading";
                return (
                  <g
                    className="point-group"
                    onClick={() => triggerReview(b.key)}
                    key={b.key}
                  >
                    {bst === "shown" && (
                      <>
                        <circle
                          className="ring"
                          cx={cx2}
                          cy="37"
                          r="6"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2"
                        />
                        <circle
                          className="ring delay"
                          cx={cx2}
                          cy="37"
                          r="6"
                          fill="none"
                          stroke="#3B4FC2"
                          strokeWidth="2"
                        />
                      </>
                    )}
                    <circle
                      cx={cx2}
                      cy="37"
                      r="5"
                      fill="#FCFCFE"
                      stroke={bActive ? "#3B4FC2" : "#8A8AA3"}
                      strokeWidth="2"
                      style={{
                        transition: "stroke 0.3s ease",
                      }}
                    />
                  </g>
                );
              })}
              {(tier.domainBreaks || []).map((b) => (
                <text
                  x={(b.tickCx2 !== void 0 ? b.tickCx2 : b.tickCx) - 4}
                  y="56"
                  fontSize="11"
                  fontStyle="italic"
                  fill="#8A8AA3"
                  key={b.key + "lbl"}
                >
                  {b.tickLabel}
                </text>
              ))}
            </svg>
            <div className="sign-rows">
              <div className="sign-row">
                <span className="sign-label pos">Concave Up:</span>
                <span className="sign-value">
                  {renderSqrtHtml(tier.concaveUp)}
                </span>
              </div>
              <div className="sign-row">
                <span className="sign-label neg">Concave Down:</span>
                <span className="sign-value">
                  {renderSqrtHtml(tier.concaveDown)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-note">
        {"Curve Sketching Studio \u2014 " +
          TIERS.filter((t) => t.ready).length +
          " of " +
          TIERS.length +
          " tiers wired"}
      </div>
    </div>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <polygon points="5,3 21,12 5,21" fill="white" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="5" y="4" width="5" height="16" fill="white" />
      <rect x="14" y="4" width="5" height="16" fill="white" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path
        d="M12 5V2L7 6l5 4V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
        fill="#6E6E86"
      />
    </svg>
  );
}
var root = createRoot(document.getElementById("root"));
root.render(<App />);
