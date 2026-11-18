<script>
  /**
   * Shared Editorial Daylight subpage header.
   * Replaces heavy dark-emerald gradient banners across subpages.
   *
   * @type {{
   *   kicker?: string,
   *   title?: string,
   *   titleAccent?: string,
   *   titleSuffix?: string,
   *   subtitle?: string,
   *   align?: 'left' | 'center',
   *   class?: string,
   *   heading?: import('svelte').Snippet,
   *   children?: import('svelte').Snippet
   * }}
   */
  let {
    kicker = '',
    title = '',
    titleAccent = '',
    titleSuffix = '',
    subtitle = '',
    align = 'left',
    class: className = '',
    heading,
    children
  } = $props();
</script>

<header class="page-header {align === 'center' ? 'is-centered' : ''} {className}">
  {#if kicker}
    <div class="page-header-kicker">{kicker}</div>
  {/if}
  {#if heading}
    <h1 class="page-header-title">{@render heading()}</h1>
  {:else if title || titleAccent}
    <h1 class="page-header-title">
      {title}{#if titleAccent}<span class="serif-accent">{titleAccent}</span>{/if}{titleSuffix}
    </h1>
  {/if}
  {#if subtitle}
    <p class="page-header-subtitle">{subtitle}</p>
  {/if}
  {#if children}
    <div class="page-header-tools">
      {@render children()}
    </div>
  {/if}
</header>

<style>
  .page-header.is-centered {
    text-align: center;
  }

  .page-header.is-centered .page-header-kicker {
    justify-content: center;
  }

  .page-header.is-centered .page-header-subtitle {
    margin-inline: auto;
  }

  .page-header-tools {
    margin-top: 1rem;
  }
</style>
