<script>
  import { onMount } from 'svelte';
  import { embedStreamlitApp } from '../../lib/streamlit-integration.js';
  import { env } from '$env/dynamic/public';

  let container;
  let previewUrl = '';

  const base = (env.PUBLIC_STREAMLIT_BASE_URL || '').replace(/\/$/, '');
  if (base) {
    previewUrl = `${base}/?embed=true&lang=czech`;
  }

  onMount(() => {
    embedStreamlitApp(container, {
      language: 'czech',
      width: '100%',
      height: '800px'
    });
  });
</script>

<section style="padding: 1rem;">
  <h1 style="margin: 0 0 0.5rem 0;">Streamlit Embed Test</h1>
  <p style="margin: 0 0 1rem 0; color: #555;">This page embeds the Streamlit app using PUBLIC_STREAMLIT_BASE_URL with <code>?embed=true</code>.</p>
  <iframe data-test-id="streamlit-frame" src={previewUrl || 'about:blank'} title="Embedded Streamlit preview" style="width:100%;height:200px;border:1px solid #ddd;border-radius:8px;margin-bottom:12px;"></iframe>
  <div bind:this={container} aria-label="streamlit-embed"></div>
</section>


