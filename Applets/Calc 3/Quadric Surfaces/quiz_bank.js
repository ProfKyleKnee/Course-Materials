// quiz_bank.js
// The 60-equation quiz bank used by the Quiz tab, with ground-truth cross-sections.
// Extracted from the built HTML's bundle; this is the original module esbuild inlined.

export const QUIZ_BANK = [
    // ---- Ellipsoid (1-10) ----
    { id: 1, type: "Ellipsoid", display: "2x\xB2 + y\xB2 + 5z\xB2 = 11", x2: 2, y2: 1, z2: 5, x: 0, y: 0, z: 0, g: -11, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 2, type: "Ellipsoid", display: "4x\xB2 + 3y\xB2 + 2z\xB2 = 6", x2: 4, y2: 3, z2: 2, x: 0, y: 0, z: 0, g: -6, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 3, type: "Ellipsoid", display: "7x\xB2 + y\xB2 + z\xB2 = 6", x2: 7, y2: 1, z2: 1, x: 0, y: 0, z: 0, g: -6, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 4, type: "Ellipsoid", display: "4x\xB2 + 4y\xB2 + 9z\xB2 = 4", x2: 4, y2: 4, z2: 9, x: 0, y: 0, z: 0, g: -4, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 5, type: "Ellipsoid", display: "9x\xB2 + 4y\xB2 + 9z\xB2 = 17", x2: 9, y2: 4, z2: 9, x: 0, y: 0, z: 0, g: -17, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 6, type: "Ellipsoid", display: "4x\xB2 + 8y\xB2 + 5z\xB2 = 4", x2: 4, y2: 8, z2: 5, x: 0, y: 0, z: 0, g: -4, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 7, type: "Ellipsoid", display: "3x\xB2 + 7y\xB2 + 6z\xB2 = 12", x2: 3, y2: 7, z2: 6, x: 0, y: 0, z: 0, g: -12, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 8, type: "Ellipsoid", display: "3x\xB2 + 4y\xB2 + 6z\xB2 = 7", x2: 3, y2: 4, z2: 6, x: 0, y: 0, z: 0, g: -7, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 9, type: "Ellipsoid", display: "2x\xB2 + 7y\xB2 + 2z\xB2 = 15", x2: 2, y2: 7, z2: 2, x: 0, y: 0, z: 0, g: -15, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    { id: 10, type: "Ellipsoid", display: "6x\xB2 + 5y\xB2 + z\xB2 = 18", x2: 6, y2: 5, z2: 1, x: 0, y: 0, z: 0, g: -18, crossSections: { x: "Ellipse", y: "Ellipse", z: "Ellipse" } },
    // ---- Elliptic Paraboloid (11-20) ----
    { id: 11, type: "Elliptic Paraboloid", display: "12y\xB2 + 2z\xB2 = 2x", x2: 0, y2: 12, z2: 2, x: -2, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Parabola", z: "Parabola" } },
    { id: 12, type: "Elliptic Paraboloid", display: "5x\xB2 + 2z\xB2 = 8y", x2: 5, y2: 0, z2: 2, x: 0, y: -8, z: 0, g: 0, crossSections: { x: "Parabola", y: "Ellipse", z: "Parabola" } },
    { id: 13, type: "Elliptic Paraboloid", display: "7y\xB2 + 5z\xB2 = -15x", x2: 0, y2: 7, z2: 5, x: 15, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Parabola", z: "Parabola" } },
    { id: 14, type: "Elliptic Paraboloid", display: "3x\xB2 + 6y\xB2 = 12z", x2: 3, y2: 6, z2: 0, x: 0, y: 0, z: -12, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Ellipse" } },
    { id: 15, type: "Elliptic Paraboloid", display: "11x\xB2 + 5y\xB2 = 3z", x2: 11, y2: 5, z2: 0, x: 0, y: 0, z: -3, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Ellipse" } },
    { id: 16, type: "Elliptic Paraboloid", display: "9x\xB2 + 12z\xB2 = 8y", x2: 9, y2: 0, z2: 12, x: 0, y: -8, z: 0, g: 0, crossSections: { x: "Parabola", y: "Ellipse", z: "Parabola" } },
    { id: 17, type: "Elliptic Paraboloid", display: "8y\xB2 + 7z\xB2 = 9x", x2: 0, y2: 8, z2: 7, x: -9, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Parabola", z: "Parabola" } },
    { id: 18, type: "Elliptic Paraboloid", display: "11y\xB2 + 6z\xB2 = 2x", x2: 0, y2: 11, z2: 6, x: -2, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Parabola", z: "Parabola" } },
    { id: 19, type: "Elliptic Paraboloid", display: "x\xB2 + 6z\xB2 = -13y", x2: 1, y2: 0, z2: 6, x: 0, y: 13, z: 0, g: 0, crossSections: { x: "Parabola", y: "Ellipse", z: "Parabola" } },
    { id: 20, type: "Elliptic Paraboloid", display: "2x\xB2 + 4y\xB2 = -19z", x2: 2, y2: 4, z2: 0, x: 0, y: 0, z: 19, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Ellipse" } },
    // ---- Hyperbolic Paraboloid (21-30) ----
    { id: 21, type: "Hyperbolic Paraboloid", display: "10z\xB2 - 7x\xB2 = 12y", x2: -7, y2: 0, z2: 10, x: 0, y: -12, z: 0, g: 0, crossSections: { x: "Parabola", y: "Hyperbola", z: "Parabola" } },
    { id: 22, type: "Hyperbolic Paraboloid", display: "2x\xB2 - y\xB2 = 4z", x2: 2, y2: -1, z2: 0, x: 0, y: 0, z: -4, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Hyperbola" } },
    { id: 23, type: "Hyperbolic Paraboloid", display: "10y\xB2 - 2z\xB2 = -13x", x2: 0, y2: 10, z2: -2, x: 13, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Parabola", z: "Parabola" } },
    { id: 24, type: "Hyperbolic Paraboloid", display: "9y\xB2 - x\xB2 = -4z", x2: -1, y2: 9, z2: 0, x: 0, y: 0, z: 4, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Hyperbola" } },
    { id: 25, type: "Hyperbolic Paraboloid", display: "5z\xB2 - 7x\xB2 = -6y", x2: -7, y2: 0, z2: 5, x: 0, y: 6, z: 0, g: 0, crossSections: { x: "Parabola", y: "Hyperbola", z: "Parabola" } },
    { id: 26, type: "Hyperbolic Paraboloid", display: "9y\xB2 - 3z\xB2 = 17x", x2: 0, y2: 9, z2: -3, x: -17, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Parabola", z: "Parabola" } },
    { id: 27, type: "Hyperbolic Paraboloid", display: "3y\xB2 - 6x\xB2 = 6z", x2: -6, y2: 3, z2: 0, x: 0, y: 0, z: -6, g: 0, crossSections: { x: "Parabola", y: "Parabola", z: "Hyperbola" } },
    { id: 28, type: "Hyperbolic Paraboloid", display: "z\xB2 - 2y\xB2 = -12x", x2: 0, y2: -2, z2: 1, x: 12, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Parabola", z: "Parabola" } },
    { id: 29, type: "Hyperbolic Paraboloid", display: "4x\xB2 - 10z\xB2 = 3y", x2: 4, y2: 0, z2: -10, x: 0, y: -3, z: 0, g: 0, crossSections: { x: "Parabola", y: "Hyperbola", z: "Parabola" } },
    { id: 30, type: "Hyperbolic Paraboloid", display: "9z\xB2 - 3y\xB2 = -5x", x2: 0, y2: -3, z2: 9, x: 5, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Parabola", z: "Parabola" } },
    // ---- Elliptic Cone (31-40) ----
    { id: 31, type: "Cone", display: "12x\xB2 + 5y\xB2 = 7z\xB2", x2: 12, y2: 5, z2: -7, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 32, type: "Cone", display: "11y\xB2 + 11z\xB2 = 6x\xB2", x2: -6, y2: 11, z2: 11, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 33, type: "Cone", display: "8y\xB2 + 9z\xB2 = 8x\xB2", x2: -8, y2: 8, z2: 9, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 34, type: "Cone", display: "2x\xB2 + 4z\xB2 = 4y\xB2", x2: 2, y2: -4, z2: 4, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 35, type: "Cone", display: "2y\xB2 + 6z\xB2 = x\xB2", x2: -1, y2: 2, z2: 6, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 36, type: "Cone", display: "10y\xB2 + 9z\xB2 = 4x\xB2", x2: -4, y2: 10, z2: 9, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 37, type: "Cone", display: "10x\xB2 + 4z\xB2 = y\xB2", x2: 10, y2: -1, z2: 4, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 38, type: "Cone", display: "2x\xB2 + 12z\xB2 = 11y\xB2", x2: 2, y2: -11, z2: 12, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 39, type: "Cone", display: "x\xB2 + 4y\xB2 = 2z\xB2", x2: 1, y2: 4, z2: -2, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 40, type: "Cone", display: "x\xB2 + 6y\xB2 = 2z\xB2", x2: 1, y2: 6, z2: -2, x: 0, y: 0, z: 0, g: 0, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    // ---- Hyperboloid of One Sheet (41-50) ----
    { id: 41, type: "Hyperboloid1Sheet", display: "4y\xB2 + 8z\xB2 - 7x\xB2 = 7", x2: -7, y2: 4, z2: 8, x: 0, y: 0, z: 0, g: -7, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 42, type: "Hyperboloid1Sheet", display: "2y\xB2 + 2z\xB2 - 7x\xB2 = 12", x2: -7, y2: 2, z2: 2, x: 0, y: 0, z: 0, g: -12, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 43, type: "Hyperboloid1Sheet", display: "7x\xB2 + 7y\xB2 - 8z\xB2 = 2", x2: 7, y2: 7, z2: -8, x: 0, y: 0, z: 0, g: -2, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 44, type: "Hyperboloid1Sheet", display: "2x\xB2 + z\xB2 - 7y\xB2 = 11", x2: 2, y2: -7, z2: 1, x: 0, y: 0, z: 0, g: -11, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 45, type: "Hyperboloid1Sheet", display: "2x\xB2 + 4z\xB2 - 4y\xB2 = 7", x2: 2, y2: -4, z2: 4, x: 0, y: 0, z: 0, g: -7, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 46, type: "Hyperboloid1Sheet", display: "9y\xB2 + 8z\xB2 - 3x\xB2 = 14", x2: -3, y2: 9, z2: 8, x: 0, y: 0, z: 0, g: -14, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 47, type: "Hyperboloid1Sheet", display: "3x\xB2 + 5y\xB2 - 8z\xB2 = 8", x2: 3, y2: 5, z2: -8, x: 0, y: 0, z: 0, g: -8, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 48, type: "Hyperboloid1Sheet", display: "2x\xB2 + 8z\xB2 - 9y\xB2 = 4", x2: 2, y2: -9, z2: 8, x: 0, y: 0, z: 0, g: -4, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 49, type: "Hyperboloid1Sheet", display: "y\xB2 + 9z\xB2 - x\xB2 = 3", x2: -1, y2: 1, z2: 9, x: 0, y: 0, z: 0, g: -3, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 50, type: "Hyperboloid1Sheet", display: "4x\xB2 + 3y\xB2 - 7z\xB2 = 16", x2: 4, y2: 3, z2: -7, x: 0, y: 0, z: 0, g: -16, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    // ---- Hyperboloid of Two Sheets (51-60) ----
    { id: 51, type: "Hyperboloid2Sheet", display: "7y\xB2 - 8x\xB2 - 5z\xB2 = 18", x2: -8, y2: 7, z2: -5, x: 0, y: 0, z: 0, g: -18, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 52, type: "Hyperboloid2Sheet", display: "4z\xB2 - 8x\xB2 - 3y\xB2 = 10", x2: -8, y2: -3, z2: 4, x: 0, y: 0, z: 0, g: -10, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 53, type: "Hyperboloid2Sheet", display: "9z\xB2 - 4x\xB2 - y\xB2 = 2", x2: -4, y2: -1, z2: 9, x: 0, y: 0, z: 0, g: -2, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 54, type: "Hyperboloid2Sheet", display: "x\xB2 - 6y\xB2 - z\xB2 = 19", x2: 1, y2: -6, z2: -1, x: 0, y: 0, z: 0, g: -19, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 55, type: "Hyperboloid2Sheet", display: "9z\xB2 - 8x\xB2 - 9y\xB2 = 6", x2: -8, y2: -9, z2: 9, x: 0, y: 0, z: 0, g: -6, crossSections: { x: "Hyperbola", y: "Hyperbola", z: "Ellipse" } },
    { id: 56, type: "Hyperboloid2Sheet", display: "2y\xB2 - x\xB2 - 9z\xB2 = 6", x2: -1, y2: 2, z2: -9, x: 0, y: 0, z: 0, g: -6, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } },
    { id: 57, type: "Hyperboloid2Sheet", display: "4x\xB2 - 2y\xB2 - 2z\xB2 = 13", x2: 4, y2: -2, z2: -2, x: 0, y: 0, z: 0, g: -13, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 58, type: "Hyperboloid2Sheet", display: "x\xB2 - 2y\xB2 - 4z\xB2 = 20", x2: 1, y2: -2, z2: -4, x: 0, y: 0, z: 0, g: -20, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 59, type: "Hyperboloid2Sheet", display: "9x\xB2 - 2y\xB2 - 7z\xB2 = 11", x2: 9, y2: -2, z2: -7, x: 0, y: 0, z: 0, g: -11, crossSections: { x: "Ellipse", y: "Hyperbola", z: "Hyperbola" } },
    { id: 60, type: "Hyperboloid2Sheet", display: "6y\xB2 - 5x\xB2 - 4z\xB2 = 8", x2: -5, y2: 6, z2: -4, x: 0, y: 0, z: 0, g: -8, crossSections: { x: "Hyperbola", y: "Ellipse", z: "Hyperbola" } }
  ];

