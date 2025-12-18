<script>
    import { onMount, createEventDispatcher } from 'svelte';
    // Remove direct Supabase import - use API endpoint instead
    // import { sendFeedback } from '$lib/supabase/client.js';
    import { currentLanguage } from '../lib/stores.js';

    const dispatch = createEventDispatcher();

    // Modal state
    let isOpen = false;
    let modalElement;
    let previouslyFocused;
    let language = 'czech';

    // Subscribe to language changes
    currentLanguage.subscribe(value => {
        language = value;
    });

    // Form state
    let feedback = '';
    let emotion = '';
    let rating = 0;
    let isSubmitting = false;
    let statusMessage = '';
    let statusType = '';

    // Form validation
    $: isFormValid = feedback.trim().length > 0;

    // Use API endpoint instead of direct Supabase
    async function sendFeedbackViaAPI(data) {
        try {
            const response = await fetch('/api/test-supabase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    feedback_text: data.text,
                    emotion: data.emotion,
                    rating: data.rating
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Content translations
    const content = {
        czech: {
            triggerText: "Zpětná vazba",
            triggerTitle: "Sdělte nám svůj názor",
            triggerLabel: "Otevřít formulář zpětné vazby",
            modalTitle: "Vaše zpětná vazba",
            modalSubtitle: "Pomozte nám vylepšit Akcelerátor altruismu. Vaše zpětná vazba je anonymní a velmi cenná.",
            feedbackLabel: "Co si myslíte o Akcelerátoru altruismu?",
            feedbackPlaceholder: "Sdělte nám svůj názor, návrhy na zlepšení, nebo jak vám aplikace pomohla...",
            emotionLabel: "Jak se právě cítíte?",
            ratingLabel: "Jak hodnotíte užitečnost aplikace?",
            optional: "(volitelné)",
            submitButton: "Odeslat zpětnou vazbu",
            submitting: "Odesílám...",
            closeLabel: "Zavřít",
            closeTitle: "Zavřít (Esc)",
            successMessage: "Děkujeme za váš podnět! Vaše zpětná vazba je pro nás velmi cenná.",
            errorMessage: "Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím později.",
            emotions: [
                { value: '', label: 'Nejmenované' },
                { value: 'grateful', label: 'Vděčný/á' },
                { value: 'hopeful', label: 'Plný/á naděje' },
                { value: 'inspired', label: 'Inspirovaný/á' },
                { value: 'neutral', label: 'Neutrální' },
                { value: 'confused', label: 'Zmatený/á' },
                { value: 'overwhelmed', label: 'Přetížený/á' }
            ],
            ratings: {
                1: 'Nepomohlo',
                2: 'Trochu pomohlo',
                3: 'Pomohlo',
                4: 'Hodně pomohlo',
                5: 'Úplně změnilo můj pohled'
            }
        },
        english: {
            triggerText: "Feedback",
            triggerTitle: "Share your thoughts",
            triggerLabel: "Open feedback form",
            modalTitle: "Your Feedback",
            modalSubtitle: "Help us improve Altruism Accelerator. Your feedback is anonymous and very valuable.",
            feedbackLabel: "What do you think about the Altruism Accelerator?",
            feedbackPlaceholder: "Share your thoughts, suggestions for improvement, or how the app helped you...",
            emotionLabel: "How are you feeling right now?",
            ratingLabel: "How do you rate the usefulness of the app?",
            optional: "(optional)",
            submitButton: "Send feedback",
            submitting: "Sending...",
            closeLabel: "Close",
            closeTitle: "Close (Esc)",
            successMessage: "Thank you for your feedback! Your input is very valuable to us.",
            errorMessage: "Failed to send feedback. Please try again later.",
            emotions: [
                { value: '', label: 'Unspecified' },
                { value: 'grateful', label: 'Grateful' },
                { value: 'hopeful', label: 'Hopeful' },
                { value: 'inspired', label: 'Inspired' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'confused', label: 'Confused' },
                { value: 'overwhelmed', label: 'Overwhelmed' }
            ],
            ratings: {
                1: 'Did not help',
                2: 'Helped a little',
                3: 'Helped',
                4: 'Helped a lot',
                5: 'Completely changed my perspective'
            }
        }
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
            const result = await sendFeedbackViaAPI({
                text: feedback.trim(),
                emotion: emotion || undefined,
                rating: rating || undefined
            });

            if (result.success) {
                statusType = 'success';
                statusMessage = content[language].successMessage;
                
                // Reset form after successful submission
                setTimeout(() => {
                    resetForm();
                    closeModal();
                }, 2000);
            } else {
                statusType = 'error';
                statusMessage = result.error || content[language].errorMessage;
            }
        } catch (error) {
            statusType = 'error';
            statusMessage = content[language].errorMessage;
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
    aria-label={content[language].triggerLabel}
    title={content[language].triggerTitle}
>
    <span class="feedback-icon">💬</span>
    <span class="feedback-text">{content[language].triggerText}</span>
</button>

<!-- Modal Overlay -->
{#if isOpen}
    <div 
        class="modal-overlay" 
        on:click={handleBackdropClick}
        on:keydown={(e) => { handleKeydown(e); if (e.key === 'Enter' || e.key === ' ') handleBackdropClick(e); }}
        role="presentation"
        aria-label="Close feedback modal"
        tabindex="-1"
    >
        <div 
            class="modal-content" 
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            bind:this={modalElement}
        >
            <!-- Modal Header -->
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">
                    💬 {content[language].modalTitle}
                </h2>
                <button 
                    class="modal-close" 
                    on:click={closeModal}
                    aria-label={content[language].closeLabel}
                    title={content[language].closeTitle}
                >
                    ✕
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                <p class="modal-subtitle">
                    {content[language].modalSubtitle}
                </p>

                <form class="feedback-form" on:submit|preventDefault={handleSubmit}>
                    <!-- Feedback Text -->
                    <div class="form-group">
                        <label for="feedback-text" class="form-label">
                            {content[language].feedbackLabel}
                        </label>
                        <textarea
                            id="feedback-text"
                            bind:value={feedback}
                            placeholder={content[language].feedbackPlaceholder}
                            class="feedback-textarea"
                            rows="4"
                            maxlength="2000"
                            disabled={isSubmitting}
                        ></textarea>
                        <div class="char-counter">
                            {feedback.length}/2000
                        </div>
                    </div>

                    <!-- Emotion Selection -->
                    <div class="form-group">
                        <label for="emotion-select" class="form-label">
                            {content[language].emotionLabel} <span class="optional">{content[language].optional}</span>
                        </label>
                        <select
                            id="emotion-select"
                            bind:value={emotion}
                            class="emotion-select"
                            disabled={isSubmitting}
                        >
                            {#each content[language].emotions as emotionOption}
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
                                {content[language].ratingLabel} <span class="optional">{content[language].optional}</span>
                            </legend>
                            <div class="star-rating">
                                {#each Array(5) as _, i}
                                    <button
                                        type="button"
                                        class="star"
                                        class:filled={i < rating}
                                        on:click={() => rating = i + 1}
                                        disabled={isSubmitting}
                                        aria-label={language === 'czech' ? `${i + 1} z 5 hvězd` : `${i + 1} out of 5 stars`}
                                    >
                                        ★
                                    </button>
                                {/each}
                                {#if rating > 0}
                                    <span class="rating-label">
                                        {content[language].ratings[rating]}
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
                                {content[language].submitting}
                            {:else}
                                {content[language].submitButton}
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
        bottom: 140px; /* Increased spacing to avoid overlap with ImmediateHelp */
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
        z-index: 45; /* Lower than modal (200) but higher than help box (40) */
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 200px;
        opacity: 1;
        visibility: visible;
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

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
        .feedback-trigger {
            bottom: 120px; /* Adjusted for mobile with proper spacing */
            right: 15px;
            left: auto;
            padding: 10px 16px;
            font-size: 0.85rem;
            max-width: 160px;
        }
        
        .feedback-text {
            display: none; /* Hide text on very small screens, keep only icon */
        }
        
        .feedback-icon {
            font-size: 1.4rem;
        }
    }

    @media (max-width: 480px) {
        .feedback-trigger {
            bottom: 100px; /* Adequate spacing from ImmediateHelp on small screens */
            right: 10px;
            border-radius: 50%;
            padding: 12px;
            width: 48px;
            height: 48px;
            justify-content: center;
        }
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
        z-index: 200;
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