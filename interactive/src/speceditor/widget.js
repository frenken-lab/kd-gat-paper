import { mount, unmount } from 'svelte';
import SpecEditorApp from './SpecEditorApp.svelte';

export function render({ model, el }) {
  const app = mount(SpecEditorApp, { target: el, props: { model } });
  return () => unmount(app);
}
