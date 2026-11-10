import { products } from './products.js';
import { productPresentation } from './product-presentation.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const productById = new Map(products.map(product => [product.id, product]));
const storageKey = 'neurela-enquiry-v1';
const selection = new Map();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeFilter = 'all';
let activeProduct = null;
let previewText = '';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function packText(pack) {
  return `${pack.size} · ${pack.packaging}`;
}

function heartIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z');
  svg.append(path);
  return svg;
}

function restoreSelection() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(saved)) return;
    saved.forEach(entry => {
      if (!Array.isArray(entry)) return;
      const [id, packIndex] = entry;
      const product = productById.get(id);
      if (product && Number.isInteger(packIndex) && product.packs[packIndex]) selection.set(id, packIndex);
    });
  } catch { /* Selection still works when browser storage is unavailable. */ }
}

function persistSelection() {
  try { sessionStorage.setItem(storageKey, JSON.stringify([...selection])); }
  catch { /* Storage is optional; keep the current selection in memory. */ }
}

let toastTimer;
function announce(message) {
  let toast = $('#toast');
  if (!toast) {
    toast = element('div', 'toast');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function updateSavedState() {
  $$('[data-saved-count]').forEach(node => {
    node.textContent = selection.size;
    node.setAttribute('aria-label', `${selection.size} saved ${selection.size === 1 ? 'product' : 'products'}`);
  });
  $$('[data-save]').forEach(button => {
    const product = productById.get(button.dataset.save);
    const isSaved = selection.has(product.id);
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${product.name}${isSaved ? ' from enquiry' : ' to enquiry'}`);
  });
  renderSavedList();
  persistSelection();
  refreshVisiblePreview();
}

function createProductCard(product) {
  const card = element('article', 'product-card');
  const presentation = productPresentation[product.id] || { label: product.formatLabel, tone: 'cream', scale: 1 };
  const art = element('div', 'product-art');
  art.dataset.tone = presentation.tone;
  const label = element('p', 'product-art-label', presentation.label);
  const stage = element('div', 'product-image-stage');
  const image = element('img');
  image.src = product.image;
  image.alt = `${product.brand} ${product.name} pack`;
  image.width = 768;
  image.height = 768;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.style.setProperty('--pack-scale', presentation.scale);
  image.style.setProperty('--pack-x', presentation.x || '0%');
  image.style.setProperty('--pack-y', presentation.y || '0%');
  const save = element('button', 'save-product');
  save.type = 'button';
  save.dataset.save = product.id;
  const isSaved = selection.has(product.id);
  save.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${product.name}${isSaved ? ' from enquiry' : ' to enquiry'}`);
  save.setAttribute('aria-pressed', String(isSaved));
  save.classList.toggle('is-saved', isSaved);
  save.append(heartIcon());
  stage.append(image);
  art.append(label, stage);

  const content = element('div', 'product-content');
  const title = element('h3', '', product.name);
  const sizes = element('p', 'product-sizes', product.packs.map(pack => pack.size).join(' / '));
  const details = element('button', 'product-details', 'View details');
  details.type = 'button';
  details.dataset.product = product.id;
  details.setAttribute('aria-label', `View ${product.name} details`);
  const actions = element('div', 'product-actions');
  actions.append(details, save);
  content.append(title, sizes, actions);
  card.append(art, content);
  return card;
}

function renderProducts() {
  const query = ($('#product-search')?.value || '').trim().toLocaleLowerCase();
  const matching = products.filter(product => {
    const formatMatches = activeFilter === 'all' || product.format === activeFilter;
    const searchable = [product.name, product.formatLabel, product.description, ...product.packs.map(packText)].join(' ').toLocaleLowerCase();
    return formatMatches && searchable.includes(query);
  });
  $('#product-grid')?.replaceChildren(...matching.map(createProductCard));
  const results = $('#results-count');
  const packCount = matching.reduce((count, product) => count + product.packs.length, 0);
  if (results) results.textContent = `${matching.length} ${matching.length === 1 ? 'product' : 'products'}${activeFilter === 'all' && !query ? ` · ${packCount} pack options` : ' found'}`;
  const empty = $('#empty-state');
  if (empty) empty.hidden = matching.length > 0;
  $$('.filter-button[data-filter]').forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('is-active', active);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setFilter(filter) {
  const valid = ['all', 'shredded', 'diced', 'slices', 'blocks', 'noodle'];
  activeFilter = valid.includes(filter) ? filter : 'all';
  renderProducts();
}

function resetFilters() {
  const search = $('#product-search');
  if (search) search.value = '';
  setFilter('all');
}

function packSelect(product, selectedIndex, id) {
  const select = element('select');
  if (id) select.id = id;
  select.setAttribute('aria-label', `Pack size for ${product.name}`);
  product.packs.forEach((pack, index) => {
    const option = element('option', '', packText(pack));
    option.value = index;
    option.selected = index === selectedIndex;
    select.append(option);
  });
  return select;
}

function renderSavedList() {
  const list = $('#saved-list');
  if (!list) return;
  if (!selection.size) {
    list.replaceChildren(element('p', 'saved-empty', 'Save the cheeses you like. Choose a pack and include them in your enquiry.'));
    return;
  }
  const items = [...selection].map(([id, packIndex]) => {
    const product = productById.get(id);
    const item = element('div', 'saved-item');
    const image = element('img');
    image.src = product.image;
    image.alt = '';
    image.width = 72;
    image.height = 72;
    image.loading = 'lazy';
    const content = element('div', 'saved-item-content');
    content.append(element('strong', '', product.name));
    const select = packSelect(product, packIndex);
    select.dataset.savedPack = id;
    content.append(select);
    const remove = element('button', 'remove-saved', 'Remove');
    remove.type = 'button';
    remove.dataset.removeSaved = id;
    remove.setAttribute('aria-label', `Remove ${product.name} from enquiry`);
    item.append(image, content, remove);
    return item;
  });
  list.replaceChildren(...items);
}

// Native dialogs provide focus trapping and Escape support. Body fixing keeps
// background scroll stable on iOS as well as desktop browsers.
let lockedScroll = null;
const dialogOpeners = new WeakMap();
const closeTimers = new WeakMap();

function lockScroll() {
  if (lockedScroll) return;
  lockedScroll = {
    y: window.scrollY,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  };
  Object.assign(document.body.style, { position: 'fixed', top: `-${lockedScroll.y}px`, width: '100%', overflow: 'hidden' });
}

function unlockScroll() {
  if (!lockedScroll) return;
  const state = lockedScroll;
  lockedScroll = null;
  Object.assign(document.body.style, { position: state.position, top: state.top, width: state.width, overflow: state.overflow });
  const previous = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, state.y);
  document.documentElement.style.scrollBehavior = previous;
}

function openDialog(dialog, opener) {
  if (!dialog || dialog.open) return;
  dialogOpeners.set(dialog, opener || document.activeElement);
  dialog.classList.remove('is-closing');
  lockScroll();
  dialog.showModal();
  if (dialog.id === 'menu-dialog') $('#menu-open')?.setAttribute('aria-expanded', 'true');
}

function closeDialog(dialog, afterClose) {
  if (!dialog?.open || closeTimers.has(dialog)) return;
  dialog.classList.add('is-closing');
  const finish = () => {
    closeTimers.delete(dialog);
    dialog.close();
    dialog.classList.remove('is-closing');
    unlockScroll();
    if (dialog.id === 'menu-dialog') $('#menu-open')?.setAttribute('aria-expanded', 'false');
    if (afterClose) afterClose();
    else {
      const opener = dialogOpeners.get(dialog);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }
  };
  if (reduceMotion.matches) finish();
  else closeTimers.set(dialog, setTimeout(finish, 220));
}

function openProduct(id, opener) {
  const product = productById.get(id);
  const content = $('#product-dialog-content');
  const dialog = $('#product-dialog');
  if (!product || !content || !dialog) return;
  activeProduct = id;
  const art = element('div', 'dialog-product-art');
  const image = element('img');
  image.src = product.image;
  image.alt = `${product.brand} ${product.name} pack`;
  image.width = 768;
  image.height = 768;
  art.append(image);
  const info = element('div', 'dialog-product-info');
  const title = element('h2', '', product.name);
  title.id = 'product-dialog-title';
  info.append(element('p', 'eyebrow', `Neurela · ${product.formatLabel}`), title, element('p', 'dialog-description', product.description));
  const label = element('label', 'pack-label', 'Choose your pack');
  label.htmlFor = 'pack-select';
  const select = packSelect(product, selection.get(id) ?? 0, 'pack-select');
  const save = element('button', 'button', selection.has(id) ? 'Update saved pack' : 'Save to enquiry');
  save.id = 'save-pack';
  save.type = 'button';
  const note = element('p', 'dialog-note', 'This adds the product to your enquiry list. It does not place an order.');
  info.append(label, select, save, note);
  content.replaceChildren(art, info);
  dialog.setAttribute('aria-labelledby', title.id);
  openDialog(dialog, opener);
}

function focusSection(hash) {
  let target;
  try { target = document.querySelector(hash); } catch { return; }
  if (!target) return;
  history.replaceState(null, '', hash);
  target.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
  const heading = target.querySelector('h1, h2') || target;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

document.addEventListener('click', event => {
  const filter = event.target.closest('.filter-button[data-filter], .category-link[data-filter]');
  if (filter) {
    if (filter.classList.contains('category-link')) {
      const search = $('#product-search');
      if (search) search.value = '';
    }
    setFilter(filter.dataset.filter);
  }

  const details = event.target.closest('[data-product]');
  if (details) openProduct(details.dataset.product, details);

  const save = event.target.closest('[data-save]');
  if (save) {
    const product = productById.get(save.dataset.save);
    if (!product) return;
    const wasSaved = selection.has(product.id);
    if (wasSaved) selection.delete(product.id);
    else selection.set(product.id, 0);
    updateSavedState();
    announce(`${product.name} ${wasSaved ? 'removed from' : 'saved to'} your enquiry.`);
  }

  const remove = event.target.closest('[data-remove-saved]');
  if (remove) {
    const product = productById.get(remove.dataset.removeSaved);
    selection.delete(remove.dataset.removeSaved);
    updateSavedState();
    announce(`${product.name} removed from your enquiry.`);
    const next = $('#saved-list select') || $('#saved-list');
    if (next) { next.tabIndex = next.matches('select') ? 0 : -1; next.focus({ preventScroll: true }); }
  }

  if (event.target.closest('#save-pack') && activeProduct) {
    const index = Number($('#pack-select').value);
    const product = productById.get(activeProduct);
    if (!product.packs[index]) return;
    selection.set(activeProduct, index);
    updateSavedState();
    announce(`${product.name}, ${product.packs[index].size}, saved to your enquiry.`);
    closeDialog($('#product-dialog'));
  }

  if (event.target.closest('[data-close-dialog]')) closeDialog(event.target.closest('dialog'));
  const menuLink = event.target.closest('#menu-dialog a[href^="#"]');
  if (menuLink) {
    event.preventDefault();
    closeDialog($('#menu-dialog'), () => focusSection(menuLink.getAttribute('href')));
  }

  if (event.target.closest('#reset-filters, [data-reset-filters]')) resetFilters();
});

$('#product-search')?.addEventListener('input', renderProducts);
$('#saved-list')?.addEventListener('change', event => {
  const select = event.target.closest('[data-saved-pack]');
  const product = select && productById.get(select.dataset.savedPack);
  const index = Number(select?.value);
  if (product && product.packs[index]) {
    selection.set(product.id, index);
    persistSelection();
    refreshVisiblePreview();
  }
});

$('#menu-open')?.addEventListener('click', event => openDialog($('#menu-dialog'), event.currentTarget));
$$('dialog').forEach(dialog => {
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  });
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeDialog($('#menu-dialog'));
});

let scrollFrame = 0;
const navigationLinks = $$('.mobile-bottom-nav a[href^="#"], .desktop-nav a[href^="#"], #menu-dialog nav a[href^="#"]');
const pageSections = $$('main > section');

function updateNavigation() {
  if (lockedScroll) return;
  const readingLine = window.scrollY + ($('#site-header')?.getBoundingClientRect().height || 80) + 50;
  let current = pageSections[0];
  for (const section of pageSections) {
    if (section.getBoundingClientRect().top + window.scrollY <= readingLine) current = section;
    else break;
  }
  let destination = current?.id || '';
  if (destination === 'formats') destination = 'home';
  navigationLinks.forEach(link => {
    const active = destination && link.getAttribute('href') === `#${destination}`;
    link.classList.toggle('active', Boolean(active));
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function updateHeader() {
  const y = lockedScroll ? lockedScroll.y : window.scrollY;
  $('#site-header')?.classList.toggle('is-scrolled', y > 32);
  updateNavigation();
  scrollFrame = 0;
}
function scheduleScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
}
window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
window.addEventListener('hashchange', scheduleScrollUpdate);
window.addEventListener('load', scheduleScrollUpdate, { once: true });
if ('ResizeObserver' in window && $('main')) new ResizeObserver(scheduleScrollUpdate).observe($('main'));

// Only hide the thumb navigation when a focused field and a substantial visual
// viewport reduction together indicate an on-screen keyboard.
const visualViewport = window.visualViewport;
let keyboardBaseline = window.innerHeight;
function updateKeyboardState() {
  const focused = document.activeElement;
  const editing = focused instanceof HTMLElement && focused.matches('input, textarea, select, [contenteditable="true"]');
  if (!editing) keyboardBaseline = window.innerHeight;
  const viewportHeight = visualViewport?.height ?? window.innerHeight;
  const keyboardOpen = window.matchMedia('(max-width: 900px)').matches && editing &&
    (!visualViewport || Math.abs(visualViewport.scale - 1) < 0.05) &&
    Math.max(keyboardBaseline, window.innerHeight) - viewportHeight > 140;
  document.body.classList.toggle('keyboard-open', Boolean(keyboardOpen));
}
document.addEventListener('focusin', updateKeyboardState);
document.addEventListener('focusout', () => requestAnimationFrame(updateKeyboardState));
visualViewport?.addEventListener('resize', updateKeyboardState, { passive: true });
window.addEventListener('resize', updateKeyboardState, { passive: true });

function buildEnquiryPreview(form) {
  const values = new FormData(form);
  const selected = [...selection].map(([id, index]) => {
    const product = productById.get(id);
    return `• ${product.name} — ${packText(product.packs[index])}`;
  });
  return [
    'NEURELA — ENQUIRY PREVIEW',
    'This enquiry has not been sent. Save this copy for your records.',
    '',
    `Name: ${values.get('name') || ''}`,
    `Email: ${values.get('email') || ''}`,
    `Business: ${values.get('business') || 'Not specified'}`,
    `City: ${values.get('city') || 'Not specified'}`,
    '',
    'Products:',
    selected.length ? selected.join('\n') : 'No products selected — general enquiry.',
    '',
    'Message:',
    String(values.get('message') || ''),
  ].join('\n');
}

function refreshVisiblePreview() {
  const preview = $('#enquiry-preview');
  const form = $('#enquiry-form');
  if (!preview || preview.hidden || !form) return;
  previewText = buildEnquiryPreview(form);
  $('#preview-text').textContent = previewText;
}

$('#enquiry-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  previewText = buildEnquiryPreview(form);
  $('#preview-text').textContent = previewText;
  form.hidden = true;
  const preview = $('#enquiry-preview');
  preview.hidden = false;
  preview.tabIndex = -1;
  preview.focus({ preventScroll: true });
  preview.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
});

$('#edit-enquiry')?.addEventListener('click', () => {
  $('#enquiry-preview').hidden = true;
  const form = $('#enquiry-form');
  form.hidden = false;
  $('input[name="name"]', form)?.focus({ preventScroll: true });
  form.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
});

$('#download-enquiry')?.addEventListener('click', () => {
  refreshVisiblePreview();
  if (!previewText) return;
  const url = URL.createObjectURL(new Blob([previewText], { type: 'text/plain;charset=utf-8' }));
  const link = element('a');
  link.href = url;
  link.download = 'neurela-enquiry-preview.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function initReveals() {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.animate(
        [{ opacity: 0.35, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(node => observer.observe(node));
}

restoreSelection();
renderProducts();
updateSavedState();
updateHeader();
initReveals();
// The HTML starts with submission disabled. Enable only after the local-only
// submit handler and all supporting UI have been installed successfully.
const enquirySubmit = $('#enquiry-form button[type="submit"]');
if (enquirySubmit) enquirySubmit.disabled = false;
