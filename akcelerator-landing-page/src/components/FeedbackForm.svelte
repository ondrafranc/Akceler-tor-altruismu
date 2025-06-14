<script>
    import { currentLanguage } from '../lib/stores.js';
    import { sendFeedback } from '../lib/supabase/client.js';
    
    // Component state
    let feedbackText = '';
    let selectedEmotion = '';
    let rating = 0;
    let isSubmitting = false;
    let submitStatus = null; // null | 'success' | 'error'
    let statusMessage = '';
    
    // Language content
    const content = {
        czech: {
            title: 'Váš názor',
            subtitle: 'Pomozte nám vylepšit akcelerátor altruismu',
            textLabel: 'Váš názor nebo návrh',
            textPlaceholder: 'Řekněte nám, jak vám pomohl akcelerátor, nebo co bychom mohli zlepšit...',
            emotionLabel: 'Jak se právě cítíte?',
            ratingLabel: 'Jak užitečný byl pro vás tento nástroj?',
            submitButton: 'Odeslat zpětnou vazbu',
            submitting: 'Odesílání...',
            successMessage: 'Děkujeme za vaši zpětnou vazbu! 🌱',
            errorMessage: 'Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím znovu.',
            emotions: {
                '': 'Vyberte...',
                'grateful': 'Vděčný/á',
                'hopeful': 'Plný/á naděje',
                'motivated': 'Motivovaný/á',
                'neutral': 'Neutrální',
                'confused': 'Zmatený/á',
                'overwhelmed': 'Přetížený/á',
                'disappointed': 'Zklamaný/á'
            },
            ratings: ['Neužitečný', 'Málo užitečný', 'Užitečný', 'Velmi užitečný', 'Vynikající']
        },
        english: {
            title: 'Your Feedback',
            subtitle: 'Help us improve the altruism accelerator',
            textLabel: 'Your feedback or suggestion',
            textPlaceholder: 'Tell us how the accelerator helped you, or what we could improve...',
            emotionLabel: 'How are you feeling right now?',
            ratingLabel: 'How useful was this tool for you?',
            submitButton: 'Send Feedback',
            submitting: 'Sending...',
            successMessage: 'Thank you for your feedback! 🌱',
            errorMessage: 'Failed to send feedback. Please try again.',
            emotions: {
                '': 'Select...',
                'grateful': 'Grateful',
                'hopeful': 'Hopeful',
                'motivated': 'Motivated',
                'neutral': 'Neutral',
                'confused': 'Confused',
                'overwhelmed': 'Overwhelmed',
                'disappointed': 'Disappointed'
            },
            ratings: ['Not useful', 'Slightly useful', 'Useful', 'Very useful', 'Excellent']
        }
    };
    
    $: currentContent = content[$currentLanguage];
    
    // Handle star rating click
    function setRating(newRating) {
        rating = newRating;
    }
    
    // Handle form submission
    async function handleSubmit() {
        if (!feedbackText.trim()) {
            statusMessage = 'Please enter some feedback';
            submitStatus = 'error';
            return;
        }
        
        isSubmitting = true;
        submitStatus = null;
        
        try {
            const result = await sendFeedback({
                text: feedbackText,
                emotion: selectedEmotion || undefined,
                rating: rating || undefined
            });
            
            if (result.success) {
                submitStatus = 'success';
                statusMessage = currentContent.successMessage;
                
                // Reset form
                feedbackText = '';
                selectedEmotion = '';
                rating = 0;
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    submitStatus = null;
                    statusMessage = '';
                }, 5000);
            } else {
                submitStatus = 'error';
                statusMessage = result.error || currentContent.errorMessage;
            }
        } catch (error) {
            submitStatus = 'error';
            statusMessage = currentContent.errorMessage;
            console.error('Feedback submission error:', error);
        } finally {
            isSubmitting = false;
        }
    }
    
    // Clear error messages when user starts typing
    function clearStatus() {
        if (submitStatus === 'error') {
            submitStatus = null;
            statusMessage = '';
        }
    }
</script>

<section class="feedback-section">
    <div class="feedback-container">
        <div class="feedback-header">
            <h3 class="feedback-title">{currentContent.title}</h3>
            <p class="feedback-subtitle">{currentContent.subtitle}</p>
        </div>
        
        <form on:submit|preventDefault={handleSubmit} class="feedback-form">
            <!-- Feedback Text -->
            <div class="form-group">
                <label for="feedback-text" class="form-label">
                    {currentContent.textLabel}
                </label>
                <textarea
                    id="feedback-text"
                    bind:value={feedbackText}
                    on:input={clearStatus}
                    placeholder={currentContent.textPlaceholder}
                    class="feedback-textarea"
                    rows="4"
                    maxlength="1000"
                    disabled={isSubmitting}
                ></textarea>
                <div class="char-counter">
                    {feedbackText.length}/1000
                </div>
            </div>
            
            <!-- Emotion Selection -->
            <div class="form-group">
                <label for="emotion-select" class="form-label">
                    {currentContent.emotionLabel} <span class="optional">(nepovinné)</span>
                </label>
                <select
                    id="emotion-select"
                    bind:value={selectedEmotion}
                    class="emotion-select"
                    disabled={isSubmitting}
                >
                    {#each Object.entries(currentContent.emotions) as [value, label]}
                        <option {value}>{label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Star Rating -->
            <div class="form-group">
                <fieldset class="star-rating-fieldset">
                    <legend class="form-label">
                        {currentContent.ratingLabel} <span class="optional">(nepovinné)</span>
                    </legend>
                    <div class="star-rating">
                        {#each Array(5) as _, i}
                            <button
                                type="button"
                                class="star"
                                class:filled={i < rating}
                                on:click={() => setRating(i + 1)}
                                disabled={isSubmitting}
                                aria-label={`Rate ${i + 1} stars: ${currentContent.ratings[i]}`}
                            >
                                ⭐
                            </button>
                        {/each}
                        {#if rating > 0}
                            <span class="rating-label">{currentContent.ratings[rating - 1]}</span>
                        {/if}
                    </div>
                </fieldset>
            </div>
            
            <!-- Submit Button -->
            <div class="form-actions">
                <button
                    type="submit"
                    class="submit-button"
                    disabled={isSubmitting || !feedbackText.trim()}
                >
                    {#if isSubmitting}
                        <span class="spinner"></span>
                        {currentContent.submitting}
                    {:else}
                        {currentContent.submitButton}
                    {/if}
                </button>
            </div>
            
            <!-- Status Messages -->
            {#if submitStatus}
                <div class="status-message" class:success={submitStatus === 'success'} class:error={submitStatus === 'error'}>
                    {statusMessage}
                </div>
            {/if}
        </form>
    </div>
</section>

<style>
    .feedback-section {
        background: var(--bg-accent);
        border: 1px solid var(--subtle-border);
        border-radius: 12px;
        padding: 2rem;
        margin: 2rem 0;
        max-width: 600px;
    }
    
    .feedback-container {
        width: 100%;
    }
    
    .feedback-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .feedback-title {
        font-size: 1.5rem;
        color: var(--czech-forest);
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
    
    .feedback-subtitle {
        color: var(--text-secondary);
        font-size: 0.95rem;
        margin: 0;
    }
    
    .feedback-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .form-label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    
    .optional {
        color: var(--text-muted);
        font-weight: normal;
        font-size: 0.8rem;
    }
    
    .feedback-textarea {
        padding: 0.75rem;
        border: 1px solid var(--subtle-border);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
        line-height: 1.5;
        resize: vertical;
        min-height: 100px;
        transition: border-color var(--timing-medium) var(--ease-gentle);
    }
    
    .feedback-textarea:focus {
        outline: none;
        border-color: var(--czech-forest);
        box-shadow: 0 0 0 2px rgba(46, 93, 49, 0.1);
    }
    
    .feedback-textarea:disabled {
        background: var(--bg-secondary);
        color: var(--text-muted);
    }
    
    .char-counter {
        font-size: 0.8rem;
        color: var(--text-muted);
        text-align: right;
    }
    
    .emotion-select {
        padding: 0.75rem;
        border: 1px solid var(--subtle-border);
        border-radius: 8px;
        background: white;
        font-family: inherit;
        font-size: 0.95rem;
        transition: border-color var(--timing-medium) var(--ease-gentle);
    }
    
    .emotion-select:focus {
        outline: none;
        border-color: var(--czech-forest);
        box-shadow: 0 0 0 2px rgba(46, 93, 49, 0.1);
    }
    
    .star-rating-fieldset {
        border: none;
        padding: 0;
        margin: 0;
    }
    
    .star-rating-fieldset legend {
        margin: 0;
        padding: 0;
    }
    
    .star-rating {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
    }
    
    .star {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all var(--timing-quick) var(--ease-gentle);
        opacity: 0.3;
    }
    
    .star:hover,
    .star.filled {
        opacity: 1;
        transform: scale(1.1);
    }
    
    .star:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
    
    .rating-label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-left: 0.5rem;
        font-weight: 500;
    }
    
    .form-actions {
        margin-top: 1rem;
    }
    
    .submit-button {
        background: linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all var(--timing-medium) var(--ease-gentle);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
    }
    
    .submit-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(46, 93, 49, 0.25);
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
    
    .status-message {
        padding: 0.75rem;
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
    
    @media (max-width: 768px) {
        .feedback-section {
            padding: 1.5rem;
            margin: 1rem 0;
        }
        
        .feedback-title {
            font-size: 1.3rem;
        }
        
        .star {
            font-size: 1.25rem;
        }
        
        .submit-button {
            padding: 1rem 1.5rem;
        }
    }
</style> 