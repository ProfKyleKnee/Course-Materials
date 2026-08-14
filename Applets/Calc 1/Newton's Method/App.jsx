import React, { useState } from 'react';
import { COLORS, IconRail } from './Shared.jsx';
import IntroTab from './tabs/IntroTab.jsx';
import FreePlayTab from './tabs/FreePlayTab.jsx';
import FailureTab from './tabs/FailureTab.jsx';
import { FAILURE_CONFIGS } from './tabs/failureConfigs.js';
import OtherReasonsTab from './tabs/OtherReasonsTab.jsx';

const NAV_GROUPS = [
  { label: 'Learn', items: [
    { id: 'intro', label: 'Intro', icon: 'intro' },
    { id: 'freePlay', label: 'Free Play', icon: 'freePlay' },
  ] },
  { label: 'Failures', items: [
    { id: 'diverge', label: 'Diverge', icon: 'diverge' },
    { id: 'flatTangent', label: 'Flat Tan.', icon: 'flatTangent' },
    { id: 'oscillation', label: 'Oscillate', icon: 'oscillation' },
    { id: 'wrongRoot', label: 'Wrong Root', icon: 'wrongRoot' },
  ] },
  { label: 'More', items: [
    { id: 'otherReasons', label: 'More', icon: 'otherReasons' },
  ] },
];

export default function App() {
  const [active, setActive] = useState('intro');

  function renderTab() {
    switch (active) {
      case 'intro': return <IntroTab />;
      case 'freePlay': return <FreePlayTab />;
      case 'diverge': return <FailureTab config={FAILURE_CONFIGS.diverge} />;
      case 'flatTangent': return <FailureTab config={FAILURE_CONFIGS.flatTangent} />;
      case 'oscillation': return <FailureTab config={FAILURE_CONFIGS.oscillation} />;
      case 'wrongRoot': return <FailureTab config={FAILURE_CONFIGS.wrongRoot} />;
      case 'otherReasons': return <OtherReasonsTab />;
      default: return null;
    }
  }

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      background: '#E8E8F2', height: '100%', padding: '24px 24px 0', boxSizing: 'border-box',
      color: COLORS.text, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        maxWidth: 1200, width: '100%', margin: '0 auto', borderRadius: 20,
        boxShadow: '0 4px 24px rgba(60,60,90,0.14)', overflow: 'hidden', flexShrink: 0,
        background: COLORS.card, display: 'flex', flexDirection: 'column',
      }}>
        <Banner />
        <div style={{ background: COLORS.bg, padding: '16px 16px 20px' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            <IconRail groups={NAV_GROUPS} active={active} onSelect={setActive} />
            {/* key={active} forces remount on tab switch, resetting toggle/slider state each visit */}
            <div key={active} style={{ flex: 1, display: 'flex', marginTop: 18 }}>
              {renderTab()}
            </div>
          </div>
        </div>
      </div>
      <PageCredit />
    </div>
  );
}

function Banner() {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, padding: '16px 28px', flexShrink: 0,
      background: 'linear-gradient(135deg, #3B4FC2, #4A5CD6)',
    }}>
      <svg
        viewBox="0 0 1200 130" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14, pointerEvents: 'none' }}
      >
        <path d="M0 95 C 200 15, 340 120, 560 45 S 900 5, 1200 75" stroke="white" strokeWidth="2.5" fill="none" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
        <a
          href="../../../browse.html#/applets"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.88)',
            textDecoration: 'none', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
            padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.12)',
          }}
        >
          ← All Applets
        </a>
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.22)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Calculus I · Unit 3
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.005em' }}>Newton&rsquo;s Method</h1>
        </div>
      </div>
    </div>
  );
}

function PageCredit() {
  return (
    <div style={{
      marginTop: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 11, padding: '18px 20px 26px', fontSize: 13.5, color: COLORS.eyebrow,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: '50%', background: '#FFFFFF', border: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <img src="../../../assets/favicon.svg" alt="" width="28" height="28" />
      </span>
      Professor Kyle Knee · Harper College Mathematics
    </div>
  );
}
