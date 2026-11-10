# Neurela standalone website

Independent cheese brand website for 5 Fingers Dairy. Work in this folder only. Production Pages project and GitHub repository: `fingers-v3-neurela`. Local server port 5177.

Preserve the supplied food-advertising structure: expressive brush lettering, irregular painted edges, food photography and varied promotional tiles. The updated colour system follows the original Neurela logo and packaging: deep chocolate, sharp cheese-gold, ivory and warm honey tones. Avoid unrelated blue, sage, olive or dominant red surfaces. Keep sections full-width with only small safe content insets. Use the original corporate Neurela cheese wordmark and the approved 10 cheese products / 18 pack options from CATALOGUE 5 FINGERS.pdf. Keep catalogue packaging unchanged. Do not invent prices, discounts, testimonials, certifications, delivery promises or contact information. Enquiries remain clearly marked local previews.

Mobile uses compact grids, no horizontal scrolling, a header integrated with the hero that gains a solid background on scroll, native dialog menu and safe-area-aware bottom navigation. Keep all tap targets at least 44px. Honour reduced motion. All site assets are local.

Responsive overrides live in src/mobile.css; desktop hero refinement lives in src/hero.css. Shared catalogue logic stays in src/main.js, with mobile search, staged filter sheet and reveal behaviour in src/mobile-ui.js. Mobile Home must scroll to the page top so the search bar above the hero remains visible. Preserve the food-app discovery rows and two-column phone product grid.

Run npm run check and npm run build, verify desktop/mobile and product-filter, saved-list and preview interactions before deployment. Use explicit --project-name=fingers-v3-neurela. Corporate parent is ../v3-final-version; only its Neurela navigation links are in scope for integration. Preserve other versions and Farm Fresh.
