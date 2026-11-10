import { readFile, access } from 'node:fs/promises';
import { products } from '../src/products.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'src/styles.css'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
if (repeated.length) throw new Error(`Duplicate IDs: ${repeated.join(', ')}`);
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error(`Missing anchor: ${match[1]}`);
}
const assets = new Set([...html.matchAll(/(?:src|href)="(\/(?:assets|fonts|downloads|src)\/[^"#]+)"/g)].map(match => match[1]));
for (const match of css.matchAll(/url\(['"]?(\/[^)'" ]+)/g)) assets.add(match[1]);
for (const product of products) assets.add(product.image);
for (const asset of assets) await access(path.join(root, asset.startsWith('/src/') ? '' : 'public', asset));
if (products.length !== 10 || products.reduce((sum, p) => sum + p.packs.length, 0) !== 18) throw new Error('Approved range must remain 10 products / 18 pack options');
if (products.some(p => p.brand !== 'Neurela' || p.category !== 'Cheese')) throw new Error('Only approved Neurela cheese products belong on this page');
if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Duplicate product IDs');
console.log(`Validated ${products.length} products, 18 packs, ${assets.size} local assets and all page anchors.`);
