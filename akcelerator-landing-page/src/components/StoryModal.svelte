<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    
    const dispatch = createEventDispatcher();
    
    // Props
    export let isOpen = false;
    export let story = null;
    
    let modalElement;
    let previouslyFocused;
    
    // Handle escape key and backdrop clicks
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
    
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }
    
    function closeModal() {
        dispatch('close');
        if (previouslyFocused) {
            previouslyFocused.focus();
        }
    }
    
    // Handle focus management
    onMount(() => {
        if (isOpen) {
            previouslyFocused = document.activeElement;
            modalElement?.focus();
        }
    });
    
    $: if (isOpen && modalElement) {
        previouslyFocused = document.activeElement;
        modalElement.focus();
    }
    
    // Add/remove event listeners
    $: if (isOpen) {
        document.addEventListener('keydown', handleKeydown);
        document.body.style.overflow = 'hidden';
    } else {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = '';
    }
    
    onDestroy(() => {
        document.removeEventListener('keydown', handleKeydown);
        document.body.style.overflow = '';
    });
</script>

<!-- Modal Overlay -->
{#if isOpen && story}
    <div 
        class="modal-overlay" 
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        tabindex="-1"
        bind:this={modalElement}
    >
        <div class="modal-content" role="document">
            <!-- Header -->
            <div class="modal-header">
                <div class="story-icon">
                    {story.icon}
                </div>
                <button 
                    class="modal-close" 
                    on:click={closeModal}
                    aria-label="Zavřít příběh"
                    type="button"
                >
                    ✕
                </button>
            </div>
            
            <!-- Story Content -->
            <div class="modal-body">
                <h2 id="story-title" class="story-title">
                    {story.name}
                </h2>
                
                <div class="story-location">
                    📍 {story.location}
                </div>
                
                <div class="story-action">
                    <h3>Co udělal/a:</h3>
                    <p>{story.action}</p>
                </div>
                
                <div class="story-impact">
                    <h3>Jaký to mělo dopad:</h3>
                    <p class="impact-text">{story.impact}</p>
                </div>
                
                <div class="story-inspiration">
                    <p class="inspiration-text">
                        ✨ <strong>I ty můžeš udělat rozdíl!</strong> Každá malá akce má svůj význam.
                    </p>
                </div>
                
                <div class="modal-actions">
                    <button 
                        class="primary-button"
                        on:click={closeModal}
                    >
                        Inspiruj mě k akci! 🌱
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    .modal-content {
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
        position: relative;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 24px 0;
        position: relative;
    }
    
    .story-icon {
        font-size: 3rem;
        text-align: center;
        background: var(--bg-accent);
        border-radius: 50%;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(46, 93, 49, 0.2);
    }
    
    .modal-close {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all var(--timing-quick) var(--ease-gentle);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-close:hover {
        background: var(--bg-accent);
        color: var(--czech-forest);
        transform: scale(1.1);
    }
    
    .modal-body {
        padding: 24px;
        text-align: center;
    }
    
    .story-title {
        font-size: 1.8rem;
        color: var(--czech-forest);
        margin: 16px 0 8px;
        font-weight: 600;
    }
    
    .story-location {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 24px;
        padding: 8px 16px;
        background: var(--bg-accent);
        border-radius: 20px;
        display: inline-block;
    }
    
    .story-action,
    .story-impact {
        margin-bottom: 20px;
        text-align: left;
        background: var(--bg-accent);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--subtle-border);
    }
    
    .story-action h3,
    .story-impact h3 {
        color: var(--czech-forest);
        font-size: 1rem;
        margin: 0 0 8px 0;
        font-weight: 600;
    }
    
    .story-action p,
    .story-impact p {
        margin: 0;
        color: var(--text-primary);
        line-height: 1.5;
    }
    
    .impact-text {
        font-weight: 500;
        color: var(--czech-forest) !important;
    }
    
    .story-inspiration {
        background: linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);
        padding: 16px;
        border-radius: 12px;
        margin: 20px 0;
        border: 2px solid var(--copper-detail);
    }
    
    .inspiration-text {
        margin: 0;
        color: var(--czech-forest);
        font-size: 1rem;
        line-height: 1.5;
    }
    
    .modal-actions {
        margin-top: 24px;
    }
    
    .primary-button {
        background: linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all var(--timing-medium) var(--ease-gentle);
        box-shadow: 0 4px 12px rgba(46, 93, 49, 0.3);
        min-width: 200px;
    }
    
    .primary-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(46, 93, 49, 0.4);
        background: linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%);
    }
    
    @media (max-width: 768px) {
        .modal-content {
            margin: 10px;
            max-height: 95vh;
            border-radius: 16px;
        }
        
        .modal-header,
        .modal-body {
            padding: 16px;
        }
        
        .story-title {
            font-size: 1.5rem;
        }
        
        .story-icon {
            width: 60px;
            height: 60px;
            font-size: 2.5rem;
        }
        
        .primary-button {
            width: 100%;
            min-width: auto;
        }
    }
    
    @media (prefers-contrast: high) {
        .modal-overlay {
            background: rgba(0, 0, 0, 0.8);
        }
        
        .modal-content {
            border: 2px solid var(--czech-forest);
        }
    }
    
    @media (prefers-reduced-motion: reduce) {
        .modal-overlay,
        .modal-content,
        .modal-close,
        .primary-button {
            animation: none;
            transition: none;
        }
    }
</style> 