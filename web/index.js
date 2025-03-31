import { registerRootComponent } from 'expo';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

// For web, we need to manually render the app
if (typeof document !== 'undefined') {
  const rootTag = document.getElementById('root');
  const root = createRoot(rootTag);
  root.render(createElement(App));
} else {
  // For native, use registerRootComponent
  registerRootComponent(App);
}

export default App;
