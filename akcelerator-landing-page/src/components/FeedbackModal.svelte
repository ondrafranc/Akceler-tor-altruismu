<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { sendFeedback } from '$lib/supabase/client';

    const dispatch = createEventDispatcher();

    // Modal state
    let isOpen = false;
    let modalElement;
    let previouslyFocused;

    // Form state
    let feedback = '';
    let emotion = '';
    let rating = 0;
    let isSubmitting = false;
    let statusMessage = '';
    let statusType = '';

    // Form validation
    $: isFormValid = feedback.trim().length > 0;

    // Emotion options
    const emotions = [
        { value: '', label: 'Nejmenované' },
        { value: 'grateful', label: 'Vděčný/á' },
        { value: 'hopeful', label: 'Plný/á naděje' },
        { value: 'inspired', label: 'Inspirovaný/á' },
        { value: 'neutral', label: 'Neutrální' },
        { value: 'confused', label: 'Zmatený/á' },
        { value: 'overwhelmed', label: 'Přetížený/á' }
    ];

    // Rating descriptions
    const ratingDescriptions = {
        1: 'Nepomohlo',
        2: 'Trochu pomohlo',
        3: 'Pomohlo',
        4: 'Hodně pomohlo',
        5: 'Úplně změnilo můj pohled'
    };

    function openModal() {
        if (typeof document !== 'undefined') {
            previouslyFocused = document.activeElement;
        }
        isOpen = true;
        
        // Focus management after modal opens (only on client)
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
                const firstInput = modalElement?.querySelector('textarea, input, button');
                firstInput?.focus();
            });
        }
    }

    function closeModal() {
        isOpen = false;
        statusMessage = '';
        statusType = '';
        
        // Return focus to previously focused element
        if (previouslyFocused) {
            previouslyFocused.focus();
        }
    }

    function resetForm() {
        feedback = '';
        emotion = '';
        rating = 0;
        statusMessage = '';
        statusType = '';
    }

    function handleKeydown(event) {
        if (event.key === 'Escape' && isOpen) {
            closeModal();
        }
    }

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }

    async function handleSubmit() {
        if (!isFormValid || isSubmitting) return;

        isSubmitting = true;
        statusMessage = '';

        try {
            const result = await sendFeedback({
                text: feedback.trim(),
                emotion: emotion || undefined,
                rating: rating || undefined
            });

            if (result.success) {
                statusType = 'success';
                statusMessage = 'Děkujeme za váš podnět! Vaše zpětná vazba je pro nás velmi cenná.';
                
                // Reset form after successful submission
                setTimeout(() => {
                    resetForm();
                    closeModal();
                }, 2000);
            } else {
                statusType = 'error';
                statusMessage = result.error || 'Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím později.';
            }
        } catch (error) {
            statusType = 'error';
            statusMessage = 'Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím později.';
            console.error('Feedback submission error:', error);
        } finally {
            isSubmitting = false;
        }
    }

    onMount(() => {
        // Trap focus within modal when open
        const handleTabKey = (event) => {
            if (!isOpen || event.key !== 'Tab') return;

            const focusableElements = modalElement?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (!focusableElements?.length) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    event.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    event.preventDefault();
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);
        
        return () => {
            document.removeEventListener('keydown', handleTabKey);
        };
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Floating Trigger Button -->
<button 
    class="feedback-trigger" 
    on:click={openModal}
    aria-label="Otevřít formulář zpětné vazby"
    title="Sdělte nám svůj názor"
>
    <span class="feedback-icon">💬</span>
    <span class="feedback-text">Zpětná vazba</span>
</button>

<!-- Modal Overlay -->
{#if isOpen}
    <div 
        class="modal-overlay" 
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
    >
        <div 
            class="modal-content" 
            bind:this={modalElement}
        >
            <!-- Modal Header -->
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">
                    💬 Vaše zpětná vazba
                </h2>
                <button 
                    class="modal-close" 
                    on:click={closeModal}
                    aria-label="Zavřít"
                    title="Zavřít (Esc)"
                >
                    ✕
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <p class="modal-subtitle">
                    Pomozte nám vylepšit Akcelerátor altruismu. Vaše zpětná vazba je anonymní a velmi cenná.
                </p>

                <form class="feedback-form" on:submit|preventDefault={handleSubmit}>
                    <!-- Feedback Text -->
                    <div class="form-group">
                        <label for="feedback-text" class="form-label">
                            Co si myslíte o Akcelerátoru altruismu?
                        </label>
                        <textarea
                            id="feedback-text"
                            bind:value={feedback}
                            placeholder="Sdělte nám svůj názor, návrhy na zlepšení, nebo jak vám aplikace pomohla..."
                            class="feedback-textarea"
                            rows="4"
                            maxlength="1000"
                            disabled={isSubmitting}
                        ></textarea>
                        <div class="char-counter">
                            {feedback.length}/1000
                        </div>
                    </div>

                    <!-- Emotion Selection -->
                    <div class="form-group">
                        <label for="emotion-select" class="form-label">
                            Jak se právě cítíte? <span class="optional">(volitelné)</span>
                        </label>
                        <select
                            id="emotion-select"
                            bind:value={emotion}
                            class="emotion-select"
                            disabled={isSubmitting}
                        >
                            {#each emotions as emotionOption}
                                <option value={emotionOption.value}>
                                    {emotionOption.label}
                                </option>
                            {/each}
                        </select>
                    </div>

                    <!-- Rating -->
                    <div class="form-group">
                        <fieldset class="star-rating-fieldset">
                            <legend class="form-label">
                                Jak hodnotíte užitečnost aplikace? <span class="optional">(volitelné)</span>
                            </legend>
                            <div class="star-rating">
                                {#each Array(5) as _, i}
                                    <button
                                        type="button"
                                        class="star"
                                        class:filled={i < rating}
                                        on:click={() => rating = i + 1}
                                        disabled={isSubmitting}
                                        aria-label={`${i + 1} z 5 hvězd`}
                                    >
                                        ★
                                    </button>
                                {/each}
                                {#if rating > 0}
                                    <span class="rating-label">
                                        {ratingDescriptions[rating]}
                                    </span>
                                {/if}
                            </div>
                        </fieldset>
                    </div>

                    <!-- Status Message -->
                    {#if statusMessage}
                        <div class="status-message {statusType}">
                            {statusMessage}
                        </div>
                    {/if}

                    <!-- Submit Button -->
                    <div class="form-actions">
                        <button
                            type="submit"
                            class="submit-button"
                            disabled={!isFormValid || isSubmitting}
                        >
                            {#if isSubmitting}
                                <span class="spinner"></span>
                                Odesílám...
                            {:else}
                                Odeslat zpětnou vazbu
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Floating Trigger Button */
    .feedback-trigger {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 20px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(46, 93, 49, 0.3);
        transition: all var(--timing-medium) var(--ease-gentle);
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 200px;
    }

    .feedback-trigger:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 30px rgba(46, 93, 49, 0.4);
        background: linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%);
    }

    .feedback-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .feedback-text {
        white-space: nowrap;
    }

    /* Modal Overlay */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 20px;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Modal Content */
    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
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

    /* Modal Header */
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 24px 0;
        border-bottom: 1px solid var(--subtle-border);
        margin-bottom: 24px;
    }

    .modal-title {
        font-size: 1.5rem;
        color: var(--czech-forest);
        margin: 0;
        font-weight: 600;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: all var(--timing-quick) var(--ease-gentle);
    }

    .modal-close:hover {
        background: var(--bg-accent);
        color: var(--czech-forest);
    }

    /* Modal Body */
    .modal-body {
        padding: 0 24px 24px;
    }

    .modal-subtitle {
        color: var(--text-secondary);
        margin-bottom: 24px;
        line-height: 1.6;
    }

    /* Form Styles (reuse existing styles) */
    .feedback-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .optional {
        color: var(--text-muted);
        font-weight: 400;
        font-size: 0.8rem;
    }

    .feedback-textarea {
        padding: 12px;
        border: 1px solid var(--subtle-border);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.9rem;
        line-height: 1.5;
        resize: vertical;
        transition: border-color var(--timing-medium) var(--ease-gentle);
    }

    .feedback-textarea:focus {
        outline: none;
        border-color: var(--czech-forest);
        box-shadow: 0 0 0 2px rgba(46, 93, 49, 0.1);
    }

    .char-counter {
        font-size: 0.8rem;
        color: var(--text-muted);
        text-align: right;
    }

    .emotion-select {
        padding: 12px;
        border: 1px solid var(--subtle-border);
        border-radius: 8px;
        background: white;
        font-family: inherit;
        font-size: 0.9rem;
        transition: border-color var(--timing-medium) var(--ease-gentle);
    }

    .emotion-select:focus {
        outline: none;
        border-color: var(--czech-forest);
        box-shadow: 0 0 0 2px rgba(46, 93, 49, 0.1);
    }

    /* Star Rating */
    .star-rating-fieldset {
        border: none;
        padding: 0;
        margin: 0;
    }

    .star-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
    }

    .star {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all var(--timing-quick) var(--ease-gentle);
        opacity: 0.3;
        color: #fbbf24;
    }

    .star:hover,
    .star.filled {
        opacity: 1;
        transform: scale(1.1);
    }

    .rating-label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-left: 8px;
        font-weight: 500;
    }

    /* Status Message */
    .status-message {
        padding: 12px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        text-align: center;
    }

    .status-message.success {
        background: rgba(74, 124, 89, 0.1);
        color: var(--czech-forest);
        border: 1px solid var(--czech-forest-light);
    }

    .status-message.error {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        border: 1px solid rgba(220, 53, 69, 0.3);
    }

    /* Submit Button */
    .submit-button {
        background: linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all var(--timing-medium) var(--ease-gentle);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .submit-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(46, 93, 49, 0.4);
    }

    .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .feedback-trigger {
            bottom: 20px;
            right: 20px;
            padding: 10px 16px;
            font-size: 0.8rem;
        }

        .feedback-text {
            display: none;
        }

        .modal-content {
            margin: 10px;
            max-height: 95vh;
        }

        .modal-header,
        .modal-body {
            padding: 16px;
        }

        .modal-title {
            font-size: 1.3rem;
        }
    }

    /* High Contrast Support */
    @media (prefers-contrast: high) {
        .modal-overlay {
            background: rgba(0, 0, 0, 0.8);
        }

        .modal-content {
            border: 2px solid var(--czech-forest);
        }
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
        .modal-overlay,
        .modal-content,
        .feedback-trigger,
        .star,
        .submit-button {
            animation: none;
            transition: none;
        }
    }
</style> 