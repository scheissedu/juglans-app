// /klinecharts-workspace/packages/preview/src/main.tsx

import { render } from 'solid-js/web';
import App from './App';

import './index.css';

render(() => <App />, document.querySelector<HTMLDivElement>('#app')!);