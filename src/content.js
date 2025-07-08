// sorry for the messy code, this is the first time i'm writing a browser extension

function debugLog(...args) {
  try { console.log('[reconchan content]', ...args); } catch {}
}

debugLog('Content script loaded');

const frameworkDetectors = [
  { name: "React", check: () => window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!Array.from(document.scripts).find(s => /react(-dom)?/i.test(s.src)) || !!document.querySelector('[data-reactroot], [data-reactid]') },
  { name: "Next.js", check: () => window.__NEXT_DATA__ || !!Array.from(document.scripts).find(s => /_next\//i.test(s.src)) || !!document.querySelector('body[data-nextjs]') },
  { name: "NestJS", check: () => /nestjs/i.test(document.documentElement.innerHTML) || !!Array.from(document.scripts).find(s => /nestjs/i.test(s.src)) },
  { name: "Astro", check: () => !!Array.from(document.scripts).find(s => /astro/i.test(s.src)) || !!document.querySelector('html[astro]') },
  { name: "Preact", check: () => window.preact || !!Array.from(document.scripts).find(s => /preact/i.test(s.src)) },
  { name: "Vue.js", check: () => window.Vue || window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector('[vue], [data-v-app]') },
  { name: "Nuxt.js", check: () => !!Array.from(document.scripts).find(s => /nuxt/i.test(s.src)) || !!window.__NUXT__ },
  { name: "Angular", check: () => window.ng || !!document.querySelector('[ng-version]') },
  { name: "AngularJS", check: () => window.angular || (window.angular && window.angular.module) },
  { name: "Svelte", check: () => window.__svelte || !!Array.from(document.scripts).find(s => /svelte/i.test(s.innerText) || /\$\$/.test(s.innerText)) },
  { name: "Ember.js", check: () => window.Ember || window.DS },
  { name: "Backbone.js", check: () => window.Backbone },
  { name: "Alpine.js", check: () => window.Alpine || !!document.querySelector('[x-data], [x-bind]') },
  { name: "Mithril.js", check: () => window.m || !!Array.from(document.scripts).find(s => /mithril/i.test(s.src)) },
  { name: "Knockout.js", check: () => window.ko },
  { name: "Inferno.js", check: () => !!Array.from(document.scripts).find(s => /inferno/i.test(s.src)) },
  { name: "SolidJS", check: () => window.solid || !!Array.from(document.scripts).find(s => /solid/i.test(s.src)) },
  { name: "Stimulus", check: () => !!document.querySelector('[data-controller]') },
  { name: "Polymer", check: () => window.Polymer },
  { name: "Riot.js", check: () => window.riot },
  { name: "Lit", check: () => !!Array.from(document.scripts).find(s => /lit\.dev/i.test(s.src)) || window.litHtml },
];

const cdnDetectors = [
  { name: "Cloudflare", check: () => document.cookie.includes("__cfduid") || /cloudflare/i.test(document.title) || !!window.__cf || /cloudflareinsights/i.test(document.documentElement.innerHTML) },
  { name: "Fastly", check: () => /fastly/i.test(document.title) || /fastly/i.test(document.documentElement.innerHTML) },
  { name: "Akamai", check: () => /akamai/i.test(document.title) || /akamai/i.test(document.documentElement.innerHTML) },
  { name: "Vercel CDN", check: () => /vercel\.com|vercel-insights/.test(document.documentElement.innerHTML) },
  { name: "Netlify CDN", check: () => /netlify\.com|netlify-insights/.test(document.documentElement.innerHTML) },
  { name: "jsDelivr", check: () => /cdn\.jsdelivr\.net/.test(document.documentElement.innerHTML) },
  { name: "BunnyCDN", check: () => /bunnycdn\.ru|b-cdn\.net/.test(document.documentElement.innerHTML) },
  { name: "StackPath", check: () => /stackpathcdn\.com/.test(document.documentElement.innerHTML) },
  { name: "KeyCDN", check: () => /keycdn\.com/.test(document.documentElement.innerHTML) },
  { name: "Google CDN", check: () => /googleapis\.com/.test(document.documentElement.innerHTML) },
  { name: "Amazon CloudFront", check: () => /cloudfront\.net/.test(document.documentElement.innerHTML) },
  { name: "Azure CDN", check: () => /azureedge\.net/.test(document.documentElement.innerHTML) }
];

const hostingDetectors = [
  { name: "Vercel", check: () => /vercel\.app/.test(location.hostname) || /vercel\.com/.test(document.documentElement.innerHTML) },
  { name: "Netlify", check: () => /netlify\.app/.test(location.hostname) || /netlify\.com/.test(document.documentElement.innerHTML) },
  { name: "GitHub Pages", check: () => /github\.io/.test(location.hostname) },
  { name: "AWS", check: () => /amazonaws\.com/.test(location.hostname) || /cloudfront\.net/.test(location.hostname) },
  { name: "Azure", check: () => /azurewebsites\.net/.test(location.hostname) || /azureedge\.net/.test(location.hostname) },
  { name: "Google Cloud", check: () => /appspot\.com/.test(location.hostname) || /googleusercontent\.com/.test(location.hostname) },
  { name: "DigitalOcean", check: () => /digitaloceanspaces\.com/.test(location.hostname) },
  { name: "Heroku", check: () => /herokuapp\.com/.test(location.hostname) },
  { name: "Firebase Hosting", check: () => /web\.app/.test(location.hostname) || /firebaseapp\.com/.test(location.hostname) },
  { name: "Render", check: () => /onrender\.com/.test(location.hostname) },
  { name: "Surge", check: () => /surge\.sh/.test(location.hostname) }
];

const analyticsDetectors = [
  { name: "Google Analytics", check: () => /www\.google-analytics\.com|gtag\(|ga\(/.test(document.documentElement.innerHTML) || document.cookie.includes('_ga=') },
  { name: "Google Tag Manager", check: () => /www\.googletagmanager\.com/.test(document.documentElement.innerHTML) },
  { name: "Segment", check: () => /cdn\.segment\.com/.test(document.documentElement.innerHTML) || document.cookie.includes('ajs_anonymous_id') },
  { name: "Hotjar", check: () => /static\.hotjar\.com/.test(document.documentElement.innerHTML) || document.cookie.includes('_hjSession') },
  { name: "Mixpanel", check: () => /cdn\.mixpanel\.com/.test(document.documentElement.innerHTML) || document.cookie.includes('mp_') }
];

const otherDetectors = [
  { name: "Bootstrap", check: () => !!window.bootstrap || !!document.querySelector('[class*="bootstrap"]') },
  { name: "Font Awesome", check: () => !!window.FontAwesome || !!document.querySelector('link[href*="font-awesome"]') },
  { name: "Moment.js", check: () => !!window.moment },
  { name: "Lodash", check: () => !!window._ && !!window._.chunk },
  { name: "Underscore.js", check: () => !!window._ && !!window._.template && !window._.chunk },
  { name: "D3.js", check: () => !!window.d3 && typeof window.d3.select === 'function' },
  { name: "Three.js", check: () => !!window.THREE && typeof window.THREE.Scene === 'function' },
  { name: "Stripe.js", check: () => !!window.Stripe || /js\.stripe\.com/.test(document.documentElement.innerHTML) },
  { name: "PayPal", check: () => /www\.paypal\.com/.test(document.documentElement.innerHTML) || !!window.paypal },
  { name: "Intercom", check: () => /widget\.intercom\.io/.test(document.documentElement.innerHTML) || !!window.Intercom },
  { name: "Zendesk", check: () => /static\.zendesk\.com/.test(document.documentElement.innerHTML) || !!window.zE },
  { name: "Sentry", check: () => /browser\.sentry-cdn\.com/.test(document.documentElement.innerHTML) || !!window.Sentry },
  { name: "Amplitude", check: () => /cdn\.amplitude\.com/.test(document.documentElement.innerHTML) || !!window.amplitude },
  { name: "Optimizely", check: () => /cdn\.optimizely\.com/.test(document.documentElement.innerHTML) || !!window.optimizely },
  { name: "New Relic", check: () => /js-agent\.newrelic\.com/.test(document.documentElement.innerHTML) || !!window.NREUM },
  { name: "Generator Meta Tag", check: () => !!document.querySelector('meta[name="generator"]') },
  { name: "Google Analytics Cookie (_ga)", check: () => document.cookie.includes('_ga=') },
  { name: "Segment Cookie (ajs_anonymous_id)", check: () => document.cookie.includes('ajs_anonymous_id') }
];

const utilityDetectors = [
  { name: "jQuery", check: () => window.jQuery || window.$ },
  { name: "Lodash", check: () => window._ && window._.VERSION && window._.VERSION.includes('lodash') },
  { name: "Underscore.js", check: () => window._ && window._.VERSION && window._.VERSION.includes('underscore') },
  { name: "Zepto.js", check: () => window.Zepto },
  { name: "Moment.js", check: () => window.moment },
  { name: "Day.js", check: () => window.dayjs },
  { name: "Axios", check: () => window.axios },
  { name: "Fetch API", check: () => typeof window.fetch === 'function' },
  { name: "XMLHttpRequest", check: () => typeof window.XMLHttpRequest === 'function' },
  { name: "RxJS", check: () => window.rxjs || !!Array.from(document.scripts).find(s => /rxjs/i.test(s.src)) },
  { name: "CryptoJS", check: () => window.CryptoJS },
  { name: "UUID", check: () => (typeof uuid === 'object' && typeof uuid.v4 === 'function') || /uuid\.v4/.test(document.documentElement.innerHTML) },
  { name: "Faker.js", check: () => window.faker },
  { name: "JS Cookie", check: () => window.Cookies }
];

const cssDetectors = [
  { name: "Bootstrap", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /container|row|col-/.test(e.className)) || !!Array.from(document.styleSheets).find(s => s.href && /bootstrap\.min\.css/i.test(s.href)) },
  { name: "Tailwind CSS", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /\b(bg|text|flex|grid|p|m|w|h|rounded|shadow)-/.test(e.className)) },
  { name: "Material UI", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /MuiButton-root/.test(e.className)) || !!Array.from(document.scripts).find(s => /MUI/i.test(s.innerText)) },
  { name: "Bulma", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /is-primary|columns|hero/.test(e.className)) },
  { name: "Foundation", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /foundation/.test(e.className)) || !!document.querySelector('[data-abide]') },
  { name: "UIkit", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /uk-(container|grid)/.test(e.className)) || !!Array.from(document.scripts).find(s => /uikit/i.test(s.src)) },
  { name: "Semantic UI", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /ui button|ui grid/.test(e.className)) },
  { name: "Spectre.css", check: () => !!Array.from(document.styleSheets).find(s => s.href && /spectre\.min\.css/i.test(s.href)) || !!document.querySelector('.label') },
  { name: "DaisyUI", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /btn-primary|alert-success/.test(e.className)) }
];

const buildToolDetectors = [
  { name: "Webpack", check: () => window.webpackJsonp || window.__webpack_require__ },
  { name: "Vite", check: () => (typeof window !== 'undefined' && window.import && window.import.meta && window.import.meta.hot) || !!Array.from(document.scripts).find(s => /vite/i.test(s.src)) },
  { name: "Parcel", check: () => window.parcelRequire || /parcel/i.test(document.documentElement.innerHTML) },
  { name: "Rollup", check: () => typeof __rollup__ !== 'undefined' },
  { name: "Esbuild", check: () => /esbuild/i.test(document.documentElement.innerHTML) },
  { name: "Next.js", check: () => window.__NEXT_DATA__ || !!Array.from(document.scripts).find(s => /_next\/static/i.test(s.src)) },
  { name: "Nuxt.js", check: () => window.__NUXT__ },
  { name: "Remix", check: () => /remix dev|remix\.config/i.test(document.documentElement.innerHTML) },
  { name: "SvelteKit", check: () => typeof __sveltekit !== 'undefined' },
  { name: "Gatsby", check: () => window.___gatsby || (window.React && /graphql/.test(document.documentElement.innerHTML)) },
  { name: "Astro", check: () => !!Array.from(document.scripts).find(s => /astro/i.test(s.src)) },
  { name: "Eleventy", check: () => !!document.querySelector('meta[name=generator][content*=Eleventy]') },
  { name: "Hugo", check: () => !!document.querySelector('meta[name=generator][content*=Hugo]') }
];

const ecommerceDetectors = [
  { name: "Shopify", check: () => window.Shopify || !!Array.from(document.scripts).find(s => /cdn\.shopify\.com/i.test(s.src)) },
  { name: "Magento", check: () => /js\/mage/i.test(document.cookie) || !!document.querySelector('meta[name=generator][content*=Magento]') },
  { name: "WooCommerce", check: () => /woocommerce_/i.test(document.cookie) || !!Array.from(document.querySelectorAll('[class]')).find(e => /woocommerce/i.test(e.className)) },
  { name: "BigCommerce", check: () => /static\.bigcommerce\.com/i.test(document.documentElement.innerHTML) || window.bcApp },
  { name: "Squarespace", check: () => /static\.squarespace\.com/i.test(document.documentElement.innerHTML) || !!document.querySelector('meta[name=generator][content*=Squarespace]') },
  { name: "Wix", check: () => window.wixBiSession || !!Array.from(document.scripts).find(s => /wixstatic\.com/i.test(s.src)) },
  { name: "Ecwid", check: () => !!Array.from(document.scripts).find(s => /ecwid\.com/i.test(s.src)) },
  { name: "OpenCart", check: () => /index\.php\?route=common\/home/i.test(location.href) }
];

const cmsDetectors = [
  { name: "WordPress", check: () => /wp-content|wp-includes/i.test(document.documentElement.innerHTML) || !!document.querySelector('meta[name=generator][content*=WordPress]') },
  { name: "Ghost CMS", check: () => /\/ghost\/api\//i.test(document.documentElement.innerHTML) || !!document.querySelector('meta[name=generator][content*=Ghost]') },
  { name: "Contentful", check: () => /contentful/i.test(document.documentElement.innerHTML) },
  { name: "Sanity", check: () => /sanity\.io/i.test(document.documentElement.innerHTML) || typeof window.__SANITY_CONTEXT !== 'undefined' },
  { name: "Strapi", check: () => /strapi\.io/i.test(document.documentElement.innerHTML) || /\/admin/i.test(location.pathname) },
  { name: "Directus", check: () => /directus\.io/i.test(document.documentElement.innerHTML) || /\/admin/i.test(location.pathname) },
  { name: "Craft CMS", check: () => /craft/i.test(document.cookie) || !!document.querySelector('meta[name=generator][content*=Craft]') },
  { name: "Prismic", check: () => /prismic/i.test(document.documentElement.innerHTML) },
  { name: "DatoCMS", check: () => /datocms/i.test(document.documentElement.innerHTML) },
  { name: "Webflow", check: () => !!Array.from(document.querySelectorAll('[class]')).find(e => /w-nav|w-hidden/.test(e.className)) || !!Array.from(document.scripts).find(s => /webflow\.js/i.test(s.src)) },
  { name: "Joomla", check: () => !!document.querySelector('meta[name=generator][content*=Joomla]') || /\/index\.php/i.test(location.pathname) },
  { name: "Drupal", check: () => /\/sites\/default/i.test(location.pathname) || typeof window.Drupal !== 'undefined' }
];

const authDetectors = [
  { name: "Auth0", check: () => /auth0\.com/i.test(document.documentElement.innerHTML) || typeof window.auth0 !== 'undefined' },
  { name: "Firebase Auth", check: () => typeof window.firebase !== 'undefined' || (window.firebase && window.firebase.auth) },
  { name: "Okta", check: () => !!Array.from(document.scripts).find(s => /okta\.com/i.test(s.src)) || /okta\.com/i.test(location.href) },
  { name: "Supabase", check: () => !!Array.from(document.scripts).find(s => /supabase/i.test(s.src)) || /supabaseUrl/i.test(document.documentElement.innerHTML) },
  { name: "Clerk.dev", check: () => !!Array.from(document.scripts).find(s => /@clerk/i.test(s.src)) || typeof window.Clerk !== 'undefined' },
  { name: "Magic.link", check: () => !!Array.from(document.scripts).find(s => /magic\.js/i.test(s.src)) || typeof magic !== 'undefined' },
  { name: "Amazon Cognito", check: () => /cognito/i.test(location.hostname) || typeof window.config !== 'undefined' },
  { name: "Passport.js", check: () => /passport/i.test(document.cookie) }
];

const aiDetectors = [
  { name: "Sentry", check: () => window.Sentry || !!Array.from(document.scripts).find(s => /sentry\.io/i.test(s.src)) },
  { name: "LogRocket", check: () => typeof window.__LOGROCKET__ !== 'undefined' },
  { name: "Datadog", check: () => !!Array.from(document.scripts).find(s => /datadog/i.test(s.src)) || /ddRum/i.test(document.documentElement.innerHTML) },
  { name: "Bugsnag", check: () => window.Bugsnag },
  { name: "New Relic", check: () => /newrelic\.com/i.test(document.documentElement.innerHTML) || typeof window.newrelic !== 'undefined' },
  { name: "AppSignal", check: () => typeof window.Appsignal !== 'undefined' },
  { name: "Raygun", check: () => typeof window.raygun4js !== 'undefined' }
];

const testDetectors = [
  { name: "Cypress", check: () => typeof window.Cypress !== 'undefined' },
  { name: "Jest", check: () => typeof __JEST__ !== 'undefined' || /jest\.fn/.test(document.documentElement.innerHTML) },
  { name: "Mocha", check: () => typeof window.mocha !== 'undefined' },
  { name: "Testing Library", check: () => /getByTestId|getByRole/.test(document.documentElement.innerHTML) }
];

const miscDetectors = [
  { name: "Stripe.js", check: () => window.Stripe || !!Array.from(document.scripts).find(s => /js\.stripe\.com/i.test(s.src)) },
  { name: "PayPal", check: () => !!Array.from(document.scripts).find(s => /paypal\.com/i.test(s.src)) },
  { name: "Plaid", check: () => !!Array.from(document.scripts).find(s => /plaid\.com/i.test(s.src)) },
  { name: "Google Maps", check: () => typeof window.google !== 'undefined' && window.google.maps },
  { name: "Mapbox", check: () => typeof window.mapboxgl !== 'undefined' },
  { name: "Cloudinary", check: () => !!Array.from(document.scripts).find(s => /cloudinary/i.test(s.src)) || /cloudinary/i.test(document.documentElement.innerHTML) },
  { name: "Font Awesome", check: () => !!Array.from(document.scripts).find(s => /fontawesome\.com/i.test(s.src)) },
  { name: "jsDelivr", check: () => !!Array.from(document.scripts).find(s => /cdn\.jsdelivr\.net/i.test(s.src)) },
  { name: "UNPKG", check: () => !!Array.from(document.scripts).find(s => /unpkg\.com/i.test(s.src)) },
  { name: "CDNJS", check: () => !!Array.from(document.scripts).find(s => /cdnjs\.cloudflare\.com/i.test(s.src)) },
  { name: "Intercom", check: () => window.Intercom },
  { name: "Crisp Chat", check: () => typeof window.$crisp !== 'undefined' || !!Array.from(document.scripts).find(s => /crisp\.chat/i.test(s.src)) },
  { name: "Drift", check: () => typeof window.drift !== 'undefined' }
];

function runDetectors(detectors) {
  debugLog('Running detectors', detectors.map(d => d.name));
  return detectors.filter(det => {
    try { return det.check(); } catch (e) { debugLog('Detector error', det.name, e); return false; }
  }).map(det => det.name);
}

// some regex patterns are sourced from https://github.com/odomojuli/regextokens & https://github.com/h33tlit/secret-regex-list
// the AWS API key detection regex is weird

const regexes = [
  { "name": "Slack Bot Token", "pattern": "xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}" },
  { "name": "Slack User Token", "pattern": "xoxp-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}" },
  { "name": "Slack Webhook", "pattern": "T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8}/[a-zA-Z0-9_]{24}" },
  { "name": "AWS Access Key ID", "pattern": "AKIA[0-9A-Z]{16}" },
  { "name": "AWS Secret Key", "pattern": "[0-9a-zA-Z/+]{40}" },
  { "name": "Google API Key", "pattern": "AIza[0-9A-Za-z-_]{35}" },
  { "name": "Google OAuth Access Token", "pattern": "ya29.[0-9A-Za-z-_]+" },
  { "name": "Google OAuth Refresh Token", "pattern": "1/[0-9A-Za-z-]{43}|1/[0-9A-Za-z-]{64}" },
  { "name": "GitHub Personal Access Token (Classic)", "pattern": "ghp_[a-zA-Z0-9]{36}" },
  { "name": "GitHub Personal Access Token (Fine-Grained)", "pattern": "github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}" },
  { "name": "GitHub OAuth Access Token", "pattern": "gho_[a-zA-Z0-9]{36}" },
  { "name": "GitHub User-to-Server Token", "pattern": "ghu_[a-zA-Z0-9]{36}" },
  { "name": "GitHub Server-to-Server Token", "pattern": "ghs_[a-zA-Z0-9]{36}" },
  { "name": "GitHub Refresh Token", "pattern": "ghr_[a-zA-Z0-9]{36}" },
  { "name": "Discord Token", "pattern": "[\\w-]{24}\\.[\\w-]{6}\\.[\\w-]{27}" },
  { "name": "Facebook Access Token", "pattern": "EAACEdEose0cBA[0-9A-Za-z]+" },
  { "name": "Instagram OAuth Token", "pattern": "[0-9a-fA-F]{7}\\.[0-9a-fA-F]{32}" },
  { "name": "Mailgun API Key", "pattern": "key-[0-9a-zA-Z]{32}" },
  { "name": "MailChimp API Key", "pattern": "[0-9a-f]{32}-us[0-9]{1,2}" },
  { "name": "Stripe Live Secret Key", "pattern": "sk_live_[0-9a-zA-Z]{24}" },
  { "name": "Stripe Restricted Key", "pattern": "rk_live_[0-9a-zA-Z]{99}" },
  { "name": "Square Access Token", "pattern": "sqOatp-[0-9A-Za-z-_]{22}" },
  { "name": "Heroku API Key", "pattern": "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" },
  { "name": "OpenAI API Key", "pattern": "sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}" },
  { "name": "WakaTime API Key", "pattern": "waka_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" },
  { "name": "Picatic API Key", "pattern": "sk_live_[0-9a-z]{32}" },
  { "name": "PayPal Access Token", "pattern": "access_token,production\\$[0-9a-z]{161[0-9a,]{32}" },
  { "name": "Amazon MWS Auth Token", "pattern": "amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" },
  { "name": "Twilio Access Token", "pattern": "55[0-9a-fA-F]{32}" },
  { "name": "Cloudinary", "pattern": "cloudinary://.*" },
  { "name": "Firebase URL", "pattern": ".*firebaseio\\.com" },
  { "name": "Slack Token", "pattern": "(xox[p|b|o|a]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})" },
  { "name": "RSA private key", "pattern": "-----BEGIN RSA PRIVATE KEY-----" },
  { "name": "SSH (DSA) private key", "pattern": "-----BEGIN DSA PRIVATE KEY-----" },
  { "name": "SSH (EC) private key", "pattern": "-----BEGIN EC PRIVATE KEY-----" },
  { "name": "PGP private key block", "pattern": "-----BEGIN PGP PRIVATE KEY BLOCK-----" },
  { "name": "Amazon AWS Access Key ID", "pattern": "AKIA[0-9A-Z]{16}" },
  { "name": "AWS API Key", "pattern": "AKIA[0-9A-Z]{16}" },
  { "name": "Facebook OAuth", "pattern": "[f|F][a|A][c|C][e|E][b|B][o|O][o|O][k|K].*['|\"][0-9a-f]{32}['|\"]" },
  { "name": "GitHub", "pattern": "[g|G][i|I][t|T][h|H][u|U][b|B].*['|\"][0-9a-zA-Z]{35,40}['|\"]" },
  { "name": "Generic API Key", "pattern": "[a|A][p|P][i|I][_]? [k|K][e|E][y|Y].*['|\"][0-9a-zA-Z]{32,45}['|\"]" },
  { "name": "Generic Secret", "pattern": "[s|S][e|E][c|C][r|R][e|E][t|T].*['|\"][0-9a-zA-Z]{32,45}['|\"]" },
  { "name": "Google Cloud Platform API Key", "pattern": "AIza[0-9A-Za-z-_]{35}" },
  { "name": "Google Cloud Platform OAuth", "pattern": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com" },
  { "name": "Google Drive API Key", "pattern": "AIza[0-9A-Za-z-_]{35}" },
  { "name": "Google Drive OAuth", "pattern": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com" },
  { "name": "Google (GCP) Service-account", "pattern": "\"type\": \"service_account\"" },
  { "name": "Google Gmail API Key", "pattern": "AIza[0-9A-Za-z-_]{35}" },
  { "name": "Google Gmail OAuth", "pattern": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com" },
  { "name": "Google YouTube API Key", "pattern": "AIza[0-9A-Za-z-_]{35}" },
  { "name": "Google YouTube OAuth", "pattern": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com" },
  { "name": "Heroku API Key (alt)", "pattern": "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" },
  { "name": "Amazon MWS Auth Token (alt)", "pattern": "amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-10-9a-f1{4}-[0-9a,]{4}-[0-9a-f]{12}" },
  { "name": "Twilio API Key", "pattern": "SK[0-9a-fA-F]{32}" },
  { "name": "Twitter Access Token", "pattern": "[t|T][w|W][i|I][t|T][t|T][e|E][r|R].*[1-9][0-9]+-[0-9a-zA-Z]{40}" },
  { "name": "Twitter OAuth", "pattern": "[t|T][w|W][i|I][t|T][t|T][e|E][r|R].*['|\"][0-9a-zA-Z]{35,44}['|\"]" },
  { "name": "Slack Webhook (legacy)", "pattern": "T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8}/[a-zA-Z0-9_]{24}" },
  { "name": "Square OAuth Secret", "pattern": "sq0csp-[0-9A-Za-z-_]{43}" },
  { "name": "Twilio Access Token", "pattern": "55[0-9a-fA-F]{32}" }
];

const suspiciousPatterns = [
  { name: "eval", regex: /\beval\s*\(/g },
  { name: "Function", regex: /\bFunction\s*\(/g },
  { name: "atob", regex: /\batob\s*\(/g },
  { name: "btoa", regex: /\bbtoa\s*\(/g },
  { name: "setTimeout (string)", regex: /setTimeout\s*\(\s*['"]/g },
  { name: "setInterval (string)", regex: /setInterval\s*\(\s*['"]/g },
  { name: "new XMLHttpRequest", regex: /new\s+XMLHttpRequest\s*\(/g },
  { name: "fetch", regex: /\bfetch\s*\(/g },
  { name: "WebSocket", regex: /new\s+WebSocket\s*\(/g }
];

const endpointRegexes = [
  /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi,
  /wss?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi,
  /fetch\s*\(\s*['"]([^'"]+)['"]/gi,
  /open\s*\(\s*['"](GET|POST|PUT|DELETE|PATCH)['"]\s*,\s*['"]([^'"]+)['"]/gi,
  /new\s+WebSocket\s*\(\s*['"]([^'"]+)['"]/gi
];

function extractRawScripts() {
  return Array.from(document.querySelectorAll("script:not([src])"))
    .map(s => s.innerText)
    .filter(Boolean);
}

function extractExternalScripts() {
  return Array.from(document.scripts)
    .map(s => s.src)
    .filter(Boolean);
}

function extractEndpoints(rawScripts) {
  const endpoints = new Set();
  const apiLike = /\/api\/|\/v\d+\/|\/graphql|\/rest|\/auth|\/token|\/user|\/admin|\/login|\/logout|\/register|\/session|\/data|\/backend|\/server|\/webhook|\/callback|\/upload|\/download|\/payment|\/checkout|\/cart|\/order|\/product|\/invoice|\/customer|\/account|\/profile|\/me|\/oauth|\/jwt|\/refresh|\/secret|\/key|\/config|\/settings|\/info|\/status|\/health/i;
  const staticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|mp4|webm|ogg|mp3|wav|zip|rar|tar|gz|pdf|docx?|xlsx?|pptx?|csv|xml|json|map)(\?.*)?$/i;
  const staticDomains = /cloudinary\.com|imgur\.com|unsplash\.com|gstatic\.com|googleusercontent\.com|cdnjs|jsdelivr|unpkg|fonts\.(googleapis|gstatic)\.com|static\./i;
  for (const script of rawScripts) {
    for (const regex of endpointRegexes) {
      let match;
      while ((match = regex.exec(script))) {
        let url = match[1] || match[2] || match[0];
        if (!url) continue;
        try {
          const u = new URL(url, location.origin);
          if (staticAsset.test(u.pathname)) continue;
          if (staticDomains.test(u.hostname)) continue;
          if (apiLike.test(u.pathname) || /\.(php|asp|aspx|jsp|cgi|pl|py|rb|go|sh|do|action|svc|ashx|cfm|dll)$/i.test(u.pathname)) {
            endpoints.add(u.href);
          }
        } catch {}
      }
    }
    // Heuristic: look for fetch/ajax calls with API-like paths
    const fetchApi = script.match(/fetch\s*\(\s*['"]([^'"]+)['"]/gi) || [];
    for (const f of fetchApi) {
      const m = f.match(/['"]([^'"]+)['"]?/);
      if (m && m[1]) {
        try {
          const u = new URL(m[1], location.origin);
          if (staticAsset.test(u.pathname)) continue;
          if (staticDomains.test(u.hostname)) continue;
          if (apiLike.test(u.pathname)) endpoints.add(u.href);
        } catch {}
      }
    }
  }
  return Array.from(endpoints);
}

function extractSecrets(rawScripts) {
  const secrets = [];
  function looksLikeSecret(val) {
    if (!val) return false;
    if (val.length < 20) return false;
    if (/^(https?:\/\/|www\.|[\w-]+\.[a-z]{2,})/i.test(val)) return false; // skip URLs/domains
    if (/\/image\/upload\//.test(val)) return false; // skip cloudinary image fragments
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|ogg|mp3|wav|zip|rar|tar|gz|pdf|docx?|xlsx?|pptx?|csv|xml|json|map)$/i.test(val)) return false; // skip static assets
    return true;
  }
  for (const script of rawScripts) {
    for (const { name, pattern } of regexes) {
      const r = new RegExp(pattern, "g");
      const matches = script.match(r);
      if (matches) {
        matches.forEach(value => {
          if (looksLikeSecret(value)) secrets.push({ type: name, value });
        });
      }
    }
  }
  return secrets;
}

function detectSuspicious(rawScripts) {
  const suspicious = [];
  for (const script of rawScripts) {
    for (const { name, regex } of suspiciousPatterns) {
      const matches = script.match(regex);
      if (matches) {
        suspicious.push({ type: name, count: matches.length });
      }
    }
  }
  return suspicious;
}

function extractJSReconData() {
  debugLog('Extracting JS recon data');
  try {
    const externalScripts = extractExternalScripts();
    const rawScripts = extractRawScripts();
    const result = {
      frameworks: runDetectors(frameworkDetectors),
      utilities: runDetectors(utilityDetectors),
      css: runDetectors(cssDetectors),
      buildTools: runDetectors(buildToolDetectors),
      ecommerce: runDetectors(ecommerceDetectors),
      cms: runDetectors(cmsDetectors),
      analytics: runDetectors(analyticsDetectors),
      auth: runDetectors(authDetectors),
      hosting: runDetectors(hostingDetectors),
      ai: runDetectors(aiDetectors),
      testing: runDetectors(testDetectors),
      misc: runDetectors(miscDetectors),
      cdns: runDetectors(cdnDetectors),
      scripts: externalScripts,
      endpoints: extractEndpoints(rawScripts),
      secrets: extractSecrets(rawScripts),
      suspicious: detectSuspicious(rawScripts)
    };
    debugLog('Detection result', result);
    return result;
  } catch (e) {
    debugLog('Recon extraction error', e);
    return { error: 'Recon extraction failed' };
  }
}

try {
  setTimeout(() => {
    debugLog('Sending recon data to background (async)');
    chrome.runtime.sendMessage({
      type: "RECON_DATA",
      data: extractJSReconData()
    });
  }, 0);
} catch (e) {
  debugLog('Fatal error in reconchan content', e);
}
