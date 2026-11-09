<script>
  export let id = "dnesni-skutek";
</script>

<section {id} class="quick-start-section" aria-label="Rychlý výběr dnešního skutku">
  <slot />
</section>

<style>
  .quick-start-section {
    position: relative;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    scroll-margin-top: 2rem;
  }
</style>
