

# reconchan
browser extension for fingerprinting websites — detect tech stacks, leaked secrets, javascript endpoints, and more.

**how it works**

once installed, reconchan automatically runs on every page you visit and extracts:

* **frontend frameworks** like react, vue, svelte, angular, next.js, astro, etc.
* **css libraries** like bootstrap, tailwind, daisyui, material ui, etc.
* **javascript utilities** like lodash, axios, jquery, moment.js, etc.
* **cdn and hosting info** like cloudflare, vercel, netlify, github pages
* **analytics + a/b tools** like google analytics, hotjar, mixpanel, segment, optimizely
* **cms and ecommerce platforms** like wordpress, shopify, webflow, magento, drupal
* **auth providers** like auth0, firebase, okta, clerk, supabase
* **build tools** like webpack, vite, parcel, rollup
* **testing libraries** like cypress, jest, mocha
* **suspicious patterns** like `eval()`, `new Function()`, and base64-encoded content
* **leaked secrets** via regex scan (tokens, api keys, credentials, etc.)
* **javascript endpoints** from fetch, xhr, websocket, hardcoded urls, and decoded base64

**why it's useful**

whether you're doing recon, bug bounty, tech research, or just snooping — reconchan helps you quickly understand what's running under the hood of any website.

**status**
this extension is under active development. things might break, detection isn't perfect, and the ui is still being improved.

