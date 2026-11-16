import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useDemo } from './store';
import { journeyIndex, tourIndex } from './lifecycle';
import { snapshotOf } from './store';

// Save the state at the start of every journey step so the presenter can restart from it (F6.3).
useDemo.subscribe((st) => {
  const ji = journeyIndex(st);
  if (st.snaps[ji] === undefined) useDemo.setState({ snaps: { ...st.snaps, [ji]: snapshotOf(st) } });
});

if (import.meta.env.DEV) Object.assign(window, { __demo: useDemo, __lc: { journeyIndex, tourIndex } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
