# Neurela — Made for the melt.

Standalone Neurela cheese homepage, part of the 5 Fingers Dairy brand family.

- Production: https://fingers-v3-neurela.pages.dev/
- GitHub: https://github.com/HaseebFASTian/fingers-v3-neurela
- Development: `npm run dev` → http://127.0.0.1:5177
- Validation: `npm run check`
- Static production build: `npm run build` → dist/

Plain semantic HTML, responsive CSS and native JavaScript modules. No runtime framework or third-party browser scripts. All fonts, imagery, product data and catalogue PDF are served locally.

The homepage contains the cheese hero, format menu, food inspiration banners, searchable complete catalogue, food-service introduction, Neurela story, serving ideas, five FAQs, saved-product enquiry preview and brand-family footer. Mobile has compact two-column product cards, drawer navigation and a bottom navigation bar.

Approved product data comes from CATALOGUE 5 FINGERS.pdf pages 7–8: 10 cheese products and 18 pack options. The original logo and catalogue-derived product illustrations are copied from the corporate final working website. Generated imagery is illustrative serving/kitchen photography. It does not portray an actual company facility or employee.

Enquiry forms create a local, unsent preview and downloadable text file. No network submission, checkout or payment is configured. Saved product choices use sessionStorage; form contact details are not persisted.

## Deployment

Use the existing authenticated Wrangler installation and explicitly target `fingers-v3-neurela`:

`wrangler pages deploy dist --project-name=fingers-v3-neurela --branch=main`

The corporate homepage's Neurela brand and footer links lead here. Farm Fresh and historical website versions remain independent.
