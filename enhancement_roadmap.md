# 🚀 Akcelerátor altruismu — Roadmap (SvelteKit-first)

This roadmap tracks the next product/tech steps after moving the primary UX to SvelteKit (`/app`, `/near`).

## Now (shipping)
- **SvelteKit app entry**: `/app` (Near / Online / Guided)
- **Beautiful near-you map**: `/near` + `/api/nearby` (real OSM places via Overpass)

## Next (highest impact)
- **Czech-only polish**: remove English surfaces, simplify copy everywhere
- **Opportunity depth**:
  - Add more Czech portals / sources
  - Add curated “starter actions” per category (1-click)
- **Better map UX**:
  - Filter presets per category (ngo/community/food/animals)
  - Shareable URLs (lat/lon/radius/kinds in query)
  - Optional clustering when zoomed out
- **Data quality & safety**:
  - Strong caching + backoff for Overpass
  - Clear disclaimer + “report incorrect place” link

## Migration plan (Streamlit → SvelteKit)
- Move remaining Streamlit-only flows into SvelteKit (keep Streamlit running until parity)
- Once parity is reached:
  - Freeze Streamlit (read-only) or remove it
  - Remove Streamlit integration code from landing components

## Optional later
- Structured partnerships / APIs with Czech orgs (real opportunities feed)
- Lightweight “done” tracking (no login) + gentle streaks (opt-in)
- Gentle nudges for users who've been inactive

---

## 📊 **Phase 4: AI & Personalization**

### A. Learning Recommendations
- Track which actions users complete vs. abandon
- Adjust difficulty/time suggestions based on success rate
- Seasonal adjustments (disaster response, giving season)

### B. Natural Language Processing
- Analyze user text responses for sentiment
- Generate custom encouragement based on language patterns
- Smart matching of user interests to action descriptions

### C. Predictive Engagement
- Identify users at risk of dropping off
- Suggest easier actions for overwhelmed users
- Recommend stretch challenges for motivated users

---

## 🔧 **Immediate Technical Improvements**

### High-Impact, Low-Effort Fixes

1. **Fix Data Loading**
   ```python
   # Replace hardcoded data with JSON loading
   causes_data = load_causes_data()  # Use real file
   ```

2. **Add Random Encouragement**
   ```python
   if random.random() < 0.3:  # 30% chance
       show_encouraging_message()
   ```

3. **Enhance Action Completion**
   ```python
   def complete_action(action_id):
       st.balloons()  # Immediate celebration
       update_user_stats(action_id)
       show_next_step_suggestion()
   ```

4. **Improve Navigation Flow**
   - Add "Quick Start" button that skips to simplified assessment
   - "Emergency Help" mode for crisis situations
   - One-click return to previous assessment step

---

## 🎨 **Visual & UX Enhancements**

### Immediate Improvements
1. **Better Color Psychology**
   - Green for growth/action buttons
   - Warm yellows for encouragement
   - Soft blues for calm reflection

2. **Micro-interactions**
   - Button hover animations
   - Progress bar filling effects
   - Smooth page transitions

3. **Accessibility**
   - High contrast mode option
   - Text size adjustment
   - Screen reader optimization

---

## 📈 **Content Strategy**

### A. Action Database Growth
**Target**: 50+ actions across all causes
**Priority Areas**:
- More $0 cost options
- 5-minute "micro-actions"
- Local community opportunities
- Crisis response actions

### B. Success Story Collection
**Sources**:
- User submissions (with permission)
- Partner organization case studies
- Historical examples of individual impact
- "Ordinary person, extraordinary impact" stories

### C. Seasonal Content
- **Winter**: Holiday giving, warming centers
- **Spring**: Environmental cleanup, community gardens
- **Summer**: Youth programs, outdoor activities
- **Fall**: Education support, preparation for giving season

---

## 🔬 **Research & Validation**

### User Testing Priorities
1. **Emotional Journey Mapping**
   - Track user emotions from entry to first action
   - Identify drop-off points
   - Test different encouragement strategies

2. **Action Completion Rates**
   - Which actions get started vs. completed?
   - What barriers prevent follow-through?
   - How to design for sustainable engagement?

3. **Impact Measurement**
   - Track real-world outcomes (donations made, hours volunteered)
   - User self-reported well-being changes
   - Long-term engagement patterns

---

## 🎯 **Success Metrics to Track**

### Emotional Impact
- **Reduced Overwhelm**: User surveys before/after
- **Increased Agency**: "I feel capable of making a difference"
- **Sustained Hope**: Return usage over 30+ days

### Behavioral Impact
- **Action Completion**: % who complete first suggested action
- **Progressive Engagement**: Users who increase involvement over time
- **Retention**: Weekly/monthly active users

### Real-World Impact
- **Verified Actions**: Donations, volunteer hours, advocacy actions
- **Ripple Effects**: Users who recruit others
- **Community Building**: Local connections formed

---

## 🚀 **Next Session Priorities**

### 1. **Fix Data Integration** (30 minutes)
- Update app.py to use JSON files
- Test all data loading functions
- Verify action matching works with real data

### 2. **Add Celebration Features** (20 minutes)
- Integrate encouragement messages
- Add random quotes and success stories
- Implement basic milestone tracking

### 3. **Enhance Action Flow** (25 minutes)
- Improve action completion workflow
- Add "next steps" suggestions
- Create simple progress tracking

### 4. **Visual Polish** (15 minutes)
- Apply enhanced CSS styling
- Add hover effects and animations
- Improve mobile responsiveness

**Total Time Investment**: ~90 minutes for transformative improvements

---

## 💡 **Long-term Vision Integration**

### From Tool → Movement
- **Tool**: Helps individuals find actions
- **Platform**: Connects helpers with opportunities  
- **Movement**: Creates culture of strategic altruism

### From Guilt → Growth
- **Guilt**: "I should do more"
- **Action**: "I am doing something meaningful"
- **Growth**: "I'm becoming the person I want to be"
- **Leadership**: "Others follow my example"

### From Overwhelm → Optimism
- **Overwhelm**: Problems feel too big
- **Clarity**: I know my role in solutions
- **Confidence**: My actions create real change
- **Optimism**: Together, we can solve anything

---

*This roadmap balances immediate wins with long-term vision, ensuring each enhancement builds toward the ultimate goal: transforming empathetic overwhelm into confident, strategic action that creates lasting change.* 