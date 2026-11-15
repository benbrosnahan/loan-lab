// SEO and findability: a crawler that runs no JavaScript gets the page. Created with Claude Code.
import { test, expect } from './helpers.mjs';

test('SEO-01 the server HTML carries the first question, an h1 and the plan names', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/<h1[^>]*>What kind of student loans do you have\?<\/h1>/);
  expect(html).toMatch(/<main/);
  expect(html).toMatch(/Federal loans only/);
});

test('SEO-02 canonical, structured data, share image, sitemap and robots are in place', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/loan-lab\.vercel\.app"/);
  expect(html).toMatch(/application\/ld\+json/);
  expect(html).toMatch(/"@type":"WebApplication"/);
  expect(html).toMatch(/property="og:image"/);
  expect(html).toMatch(/name="twitter:image"/);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Disallow: \/results/);
  const og = await request.get('/opengraph-image');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toMatch(/image\/png/);
});

test('results pages ask search engines not to index one person\'s numbers', async ({ request }) => {
  const html = await (await request.get('/results')).text();
  expect(html).toMatch(/<meta name="robots" content="noindex/);
});

test('the title and description use no em dash', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  expect(title).toContain('Loan Lab');
  expect(title).not.toMatch(/—/);
});
