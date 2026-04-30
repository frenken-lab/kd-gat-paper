<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import data from './data.json';
  import { onMount } from 'svelte';

  interface Algorithm {
    id: string;
    body: string;
  }

  interface AlgorithmData {
    algorithms: Algorithm[];
  }

  const isEmpty =
    !(data as AlgorithmData).algorithms ||
    !Array.isArray((data as AlgorithmData).algorithms) ||
    (data as AlgorithmData).algorithms.length === 0;

  let mounted = $state(false);

  onMount(async () => {
    // pseudocode.js requires KaTeX on window
    const katex = await import('katex');
    window.katex = katex.default || katex;

    await import('katex/dist/katex.min.css');
    await import('pseudocode/build/pseudocode.min.css');

    const pseudocode = await import('pseudocode');
    mounted = true;

    // Render each algorithm after DOM update
    requestAnimationFrame(() => {
      for (const algo of (data as AlgorithmData).algorithms) {
        const el = document.getElementById(`algo-${algo.id}`);
        if (el) {
          pseudocode.renderElement(el, {
            lineNumber: true,
            lineNumberPunc: ' ',
            noEnd: false,
            captionCount: 0,
            titlePrefix: 'Algorithm',
          });
        }
      }

      // Add hover highlighting to rendered lines
      document.querySelectorAll('.ps-line').forEach(line => {
        line.addEventListener('mouseenter', () =>
          line.classList.add('ps-hover'),
        );
        line.addEventListener('mouseleave', () =>
          line.classList.remove('ps-hover'),
        );
      });
    });
  });
</script>

<Figure title="Algorithm Pseudocode">
  {#if isEmpty}
    <p class="empty">Awaiting algorithm data.</p>
  {:else}
    <div class="algorithm-container">
      {#each (data as AlgorithmData).algorithms as algo}
        <div class="algorithm-block">
          <pre
            id="algo-{algo.id}"
            class="algorithm-source"
            style:display={mounted ? 'none' : 'block'}>{algo.body}</pre>
        </div>
      {/each}
    </div>
  {/if}
</Figure>

<style>
  .algorithm-container {
    font-family: 'Computer Modern', 'Latin Modern Roman', 'Times New Roman',
      serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 16px;
  }

  .algorithm-block {
    margin: 24px 0;
  }

  .algorithm-source {
    font-size: 13px;
    white-space: pre-wrap;
    color: #666;
    background: #f8f8f8;
    padding: 12px;
    border-radius: 4px;
  }

  :global(.ps-hover) {
    background: #e8f0ff !important;
    transition: background 0.15s;
  }

  :global(.ps-line) {
    cursor: default;
    border-radius: 2px;
    padding: 1px 4px;
  }

  :global(.ps-root) {
    border: 1px solid #4a86c8 !important;
    border-radius: 4px;
    background: #f8faff;
  }

  :global(.ps-root .ps-algorithm-name) {
    color: #0066cc;
  }
</style>
