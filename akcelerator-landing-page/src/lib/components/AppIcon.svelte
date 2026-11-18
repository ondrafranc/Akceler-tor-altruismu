<script>
  import { resolveIconKey } from '$lib/icons/iconRegistry.js';
  import { getLucideIcon } from '$lib/icons/lucideIcons.js';

  /**
   * @type {{
   *   name?: string | null | undefined,
   *   size?: number,
   *   strokeWidth?: number,
   *   class?: string,
   *   label?: string
   * }}
   */
  let {
    name = 'circle-dot',
    size = 16,
    strokeWidth = 1.85,
    class: className = '',
    label = ''
  } = $props();

  const resolvedKey = $derived(resolveIconKey(name));
  const isPaw = $derived(resolvedKey === 'paw');
  const IconComponent = $derived(resolvedKey === 'paw' ? null : getLucideIcon(resolvedKey));
</script>

{#if isPaw}
  <svg
    class="app-icon app-icon-paw {className}"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden={label ? undefined : 'true'}
    aria-label={label || undefined}
    role={label ? 'img' : undefined}
  >
    <circle cx="7.5" cy="9.5" r="2.3" />
    <circle cx="12" cy="7" r="2.3" />
    <circle cx="16.5" cy="9.5" r="2.3" />
    <path d="M12 12.2c-3.1 0-5.4 2.2-5.4 4.5 0 1.6 1.3 2.6 3 2.6 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.7 0 3-1 3-2.6 0-2.3-2.3-4.5-5.4-4.5Z" />
  </svg>
{:else if IconComponent}
  <IconComponent
    {size}
    {strokeWidth}
    class="app-icon {className}"
    aria-hidden={label ? undefined : 'true'}
    aria-label={label || undefined}
    role={label ? 'img' : undefined}
  />
{/if}

<style>
  :global(.app-icon) {
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>
