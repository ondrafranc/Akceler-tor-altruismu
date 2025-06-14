<script>
  export let data;
</script>

<div style="padding: 2rem; font-family: Arial, sans-serif;">
  <h1>Supabase Connection Test</h1>
  
  <!-- Connection Status -->
  <div style="margin-bottom: 2rem; padding: 1rem; border-radius: 8px; {data.connectionTest?.success ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}">
    {#if data.connectionTest?.success}
      ✅ <strong>Connection Successful!</strong>
      <br>Connected to table: <code>{data.connectionTest.table}</code>
    {:else}
      ❌ <strong>Connection Failed</strong>
      <br>Error: {data.connectionTest?.error || 'Unknown error'}
    {/if}
  </div>

  <!-- Countries List (from documentation example) -->
  {#if data.countries && data.countries.length > 0}
    <h2>Countries:</h2>
    <ul>
      {#each data.countries as country}
        <li>{country.name}</li>
      {/each}
    </ul>
  {:else}
    <p><em>No countries found (this is expected if you don't have a countries table)</em></p>
  {/if}

  <!-- Feedback Data (fallback) -->
  {#if data.feedback && data.feedback.length > 0}
    <h2>Recent Feedback:</h2>
    <ul>
      {#each data.feedback as item}
        <li>
          <strong>{item.emotion || 'No emotion'}</strong> 
          {#if item.rating}(Rating: {item.rating}/5){/if}
          <br>
          <small>{item.text?.substring(0, 100)}...</small>
          <br>
          <em>Created: {new Date(item.created_at).toLocaleString()}</em>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Instructions -->
  <div style="margin-top: 2rem; padding: 1rem; background: #e3f2fd; border-radius: 8px;">
    <h3>Testing Instructions:</h3>
    <ol>
      <li>If you see ✅ above, your Supabase connection is working!</li>
      <li>The countries table is from the SvelteKit documentation example</li>
      <li>The feedback table is from your existing app</li>
      <li>You can now go back to your main app: <a href="/">Home</a></li>
    </ol>
  </div>
</div> 