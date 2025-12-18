<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Chyba - Akcelerátor altruismu</title>
</svelte:head>

<div class="error-container">
  <div class="error-content">
    <h1>🌱 Akcelerátor altruismu</h1>
    <h2>Něco se pokazilo, ale neztrácejme naději!</h2>
    
    <p>
      Omlouváme se za technické problémy. Mezitím můžete přímo navštívit náš akcelerátor:
    </p>
    
    <div class="error-actions">
      <a 
        		href="/app" 
        class="primary-button"
      >
        🚀 Spustit akcelerátor
      </a>
      
      <button 
        class="secondary-button"
        on:click={() => window.location.reload()}
      >
        🔄 Zkusit znovu
      </button>
    </div>
    
    <div class="error-details">
      <p><strong>Vítej v Akcelerátoru altruismu</strong></p>
      <p>Pomáhej lidem po celé ČR – snadno, lokálně a prakticky.</p>
      <p>Najdi svou cestu od empatie k praktické akci.</p>
    </div>
  </div>
</div>

<style>
  .error-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #F8FBF8 0%, #F0F6F0 100%);
    font-family: 'Source Sans Pro', sans-serif;
  }
  
  .error-content {
    max-width: 600px;
    text-align: center;
    background: white;
    padding: 3rem 2rem;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(46, 93, 49, 0.1);
    border: 1px solid #D4E7D4;
  }
  
  h1 {
    color: #2E5D31;
    font-size: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
  
  h2 {
    color: #4A7C59;
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  
  p {
    color: #5A6B5A;
    line-height: 1.6;
    margin-bottom: 1rem;
  }
  
  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
    flex-wrap: wrap;
  }
  
  .primary-button {
    background: linear-gradient(135deg, #2E5D31 0%, #4A7C59 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.2s ease;
  }
  
  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(46, 93, 49, 0.25);
  }
  
  .secondary-button {
    background: transparent;
    color: #2E5D31;
    padding: 0.75rem 1.5rem;
    border: 2px solid #2E5D31;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .secondary-button:hover {
    background: #2E5D31;
    color: white;
  }
  
  .error-details {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #D4E7D4;
  }
  
  .error-details p {
    margin-bottom: 0.5rem;
  }
  
  @media (max-width: 600px) {
    .error-content {
      padding: 2rem 1rem;
    }
    
    .error-actions {
      flex-direction: column;
      align-items: center;
    }
    
    .primary-button,
    .secondary-button {
      width: 100%;
      max-width: 250px;
      justify-content: center;
    }
  }
</style> 