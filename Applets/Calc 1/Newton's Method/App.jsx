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
      background: COLORS.bg, minHeight: '100vh', padding: 20, boxSizing: 'border-box',
      color: COLORS.text,
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Newton&rsquo;s Method</h1>
        <div style={{ display: 'flex', gap: 18 }}>
          <IconRail groups={NAV_GROUPS} active={active} onSelect={setActive} />
          {/* key={active} forces remount on tab switch, resetting toggle/slider state each visit */}
          <div key={active} style={{ flex: 1, display: 'flex', marginTop: 18 }}>
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
