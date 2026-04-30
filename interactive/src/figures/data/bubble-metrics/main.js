import { mount } from 'svelte';

import { autoResizeIframe } from '../../../lib/figure-resize.ts';
import App from './App.svelte';
mount(App, { target: document.getElementById('app') });
autoResizeIframe();
