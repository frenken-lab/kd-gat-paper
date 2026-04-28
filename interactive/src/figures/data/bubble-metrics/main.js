import { mount } from "svelte";
import App from "./App.svelte";
import { autoResizeIframe } from "../../../lib/figure-resize.ts";
mount(App, { target: document.getElementById("app") });
autoResizeIframe();
