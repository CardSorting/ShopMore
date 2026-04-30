# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Homepage >> should navigate to products page
- Location: e2e/home.spec.ts:15:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: /Shop Now/i }).first()
    - locator resolved to <a href="/products" class="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline">Shop Now</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="max-w-7xl mx-auto text-center relative z-10">…</div> from <main class="flex-1">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="max-w-7xl mx-auto text-center relative z-10">…</div> from <main class="flex-1">…</main> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <h2 class="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2> from <main class="flex-1">…</main> subtree intercepts pointer events
  13 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="max-w-7xl mx-auto text-center relative z-10">…</div> from <main class="flex-1">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="max-w-7xl mx-auto text-center relative z-10">…</div> from <main class="flex-1">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <h2 class="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2> from <main class="flex-1">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <h2 class="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2> from <main class="flex-1">…</main> subtree intercepts pointer events
  2 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="max-w-7xl mx-auto text-center relative z-10">…</div> from <main class="flex-1">…</main> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Skip to main content" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - navigation [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "ShopMore" [ref=e8] [cursor=pointer]:
            - /url: /
            - img [ref=e10]
            - generic [ref=e14]: ShopMore
          - generic [ref=e16] [cursor=pointer]:
            - img [ref=e17]
            - generic [ref=e20]:
              - generic [ref=e21]: Search...
              - generic [ref=e23]: ⌘K
          - generic [ref=e24]:
            - generic [ref=e25]:
              - button "Catalog" [ref=e26]:
                - text: Catalog
                - img [ref=e27]
              - generic:
                - generic:
                  - generic:
                    - heading "Categories" [level=4]
                    - generic:
                      - link "All Products Explore the latest":
                        - /url: /products
                        - generic:
                          - img
                        - generic:
                          - paragraph: All Products
                          - paragraph: Explore the latest
                      - link "New Arrivals Explore the latest":
                        - /url: /products?category=new
                        - generic:
                          - img
                        - generic:
                          - paragraph: New Arrivals
                          - paragraph: Explore the latest
                      - link "Featured Explore the latest":
                        - /url: /products?category=featured
                        - generic:
                          - img
                        - generic:
                          - paragraph: Featured
                          - paragraph: Explore the latest
                  - generic:
                    - heading "Featured" [level=4]
                    - generic:
                      - img "Featured Card"
                    - paragraph: Weekly Highlights
                    - link "Shop Now":
                      - /url: /products
            - link "New Arrivals" [ref=e29] [cursor=pointer]:
              - /url: /products?category=new
            - link "Personal Collection" [ref=e30] [cursor=pointer]:
              - /url: /wishlist
        - generic [ref=e31]:
          - button "Open cart" [ref=e32]:
            - img [ref=e33]
            - generic [ref=e37]: Cart
          - link "Login" [ref=e39] [cursor=pointer]:
            - /url: /login
    - main [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e43]:
          - heading "Your TCG Destination" [level=1] [ref=e44]
          - paragraph [ref=e45]: Discover booster boxes, rare singles, and accessories for Pokemon, MTG, and more.
          - link "Shop Now" [ref=e46] [cursor=pointer]:
            - /url: /products
            - text: Shop Now
            - img [ref=e47]
        - generic [ref=e50]:
          - generic [ref=e51]:
            - img [ref=e52]
            - heading "Authentic Products" [level=3] [ref=e54]
            - paragraph [ref=e55]: Every card verified for authenticity
          - generic [ref=e56]:
            - img [ref=e57]
            - heading "Rare Finds" [level=3] [ref=e60]
            - paragraph [ref=e61]: Holo, secret rares, and chase cards
          - generic [ref=e62]:
            - img [ref=e63]
            - heading "Fast Shipping" [level=3] [ref=e68]
            - paragraph [ref=e69]: Ships within 24 hours
        - generic [ref=e71]:
          - heading "Featured Products" [level=2] [ref=e72]
          - generic [ref=e73]:
            - link "E2E Test Card 1777561766982 collectibles E2E Test Card 1777561766982 $49.99" [ref=e74] [cursor=pointer]:
              - /url: /products/4639bfb0-21a7-494a-84e8-3d71090a188c
              - img "E2E Test Card 1777561766982" [ref=e76]
              - generic [ref=e77]:
                - paragraph [ref=e78]: collectibles
                - heading "E2E Test Card 1777561766982" [level=3] [ref=e79]
                - paragraph [ref=e80]: $49.99
            - link "E2E Test Card 1777561717886 collectibles E2E Test Card 1777561717886 $49.99" [ref=e81] [cursor=pointer]:
              - /url: /products/40e53722-9bfd-49e1-be3b-bba1a99f4466
              - img "E2E Test Card 1777561717886" [ref=e83]
              - generic [ref=e84]:
                - paragraph [ref=e85]: collectibles
                - heading "E2E Test Card 1777561717886" [level=3] [ref=e86]
                - paragraph [ref=e87]: $49.99
            - link "Deck Builder’s Toolkit accessory Deck Builder’s Toolkit $24.99" [ref=e88] [cursor=pointer]:
              - /url: /products/f15621d0-444e-4773-bf40-8661fa8cc037
              - img "Deck Builder’s Toolkit" [ref=e90]
              - generic [ref=e91]:
                - paragraph [ref=e92]: accessory
                - heading "Deck Builder’s Toolkit" [level=3] [ref=e93]
                - paragraph [ref=e94]: $24.99
            - link "Paradox Rift Booster Box box Paradox Rift Booster Box $139.99" [ref=e95] [cursor=pointer]:
              - /url: /products/93f7edd1-da61-42df-8004-fdbbee7f43d8
              - img "Paradox Rift Booster Box" [ref=e97]
              - generic [ref=e98]:
                - paragraph [ref=e99]: box
                - heading "Paradox Rift Booster Box" [level=3] [ref=e100]
                - paragraph [ref=e101]: $139.99
    - contentinfo [ref=e102]:
      - button "Back to top":
        - img
      - generic [ref=e104]:
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]:
              - img [ref=e108]
              - img [ref=e110]
              - img [ref=e112]
              - img [ref=e114]
              - img [ref=e116]
            - paragraph [ref=e118]: 4.9/5 Rating
            - paragraph [ref=e119]: From 10,000+ Players
          - generic [ref=e120]:
            - img [ref=e121]
            - paragraph [ref=e123]: Fast Shipping
            - paragraph [ref=e124]: 24h Order Processing
          - generic [ref=e125]:
            - img [ref=e126]
            - paragraph [ref=e129]: Authentic
            - paragraph [ref=e130]: 100% Genuine Cards
          - generic [ref=e131]:
            - img [ref=e132]
            - paragraph [ref=e135]: Secure Pay
            - paragraph [ref=e136]: SSL Encrypted Checkout
        - generic [ref=e137]:
          - generic [ref=e138]:
            - generic [ref=e139]:
              - link "PlayMoreTCG" [ref=e140] [cursor=pointer]:
                - /url: /
                - img [ref=e141]
                - text: PlayMoreTCG
              - paragraph [ref=e145]: Founded by collectors, for collectors. We are building the world's most trusted platform for Trading Card Games, ensuring every player has access to the cards they love.
            - generic [ref=e146]:
              - link "Discord" [ref=e147] [cursor=pointer]:
                - /url: "#"
                - img [ref=e148]
              - link "Instagram" [ref=e150] [cursor=pointer]:
                - /url: "#"
                - img [ref=e151]
              - link "Community" [ref=e154] [cursor=pointer]:
                - /url: "#"
                - img [ref=e155]
              - link "Website" [ref=e160] [cursor=pointer]:
                - /url: "#"
                - img [ref=e161]
            - generic [ref=e164] [cursor=pointer]:
              - img [ref=e165]
              - generic [ref=e168]:
                - paragraph [ref=e169]: Need help?
                - paragraph [ref=e170]: 24/7 Expert Support
              - img [ref=e171]
          - generic [ref=e173]:
            - generic [ref=e174]:
              - heading "Shop" [level=3] [ref=e175]
              - list [ref=e176]:
                - listitem [ref=e177]:
                  - link "New Releases" [ref=e178] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e179]:
                  - link "Single Cards" [ref=e180] [cursor=pointer]:
                    - /url: /products?category=rare
                - listitem [ref=e181]:
                  - link "Sealed Boxes" [ref=e182] [cursor=pointer]:
                    - /url: /products?category=sealed
                - listitem [ref=e183]:
                  - link "Clearance" [ref=e184] [cursor=pointer]:
                    - /url: /products?category=sale
                    - text: Clearance
                    - img [ref=e185]
            - generic [ref=e187]:
              - heading "Services" [level=3] [ref=e188]
              - list [ref=e189]:
                - listitem [ref=e190]:
                  - link "Professional Grading" [ref=e191] [cursor=pointer]:
                    - /url: /grading
                - listitem [ref=e192]:
                  - link "Sell Your Cards" [ref=e193] [cursor=pointer]:
                    - /url: /sell
                - listitem [ref=e194]:
                  - link "Trade-In Program" [ref=e195] [cursor=pointer]:
                    - /url: /trade
                - listitem [ref=e196]:
                  - link "Card Protection" [ref=e197] [cursor=pointer]:
                    - /url: /protection
            - generic [ref=e198]:
              - heading "Community" [level=3] [ref=e199]
              - list [ref=e200]:
                - listitem [ref=e201]:
                  - link "Live Events" [ref=e202] [cursor=pointer]:
                    - /url: /events
                - listitem [ref=e203]:
                  - link "Strategy Blog" [ref=e204] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e205]:
                  - link "Player Forums" [ref=e206] [cursor=pointer]:
                    - /url: /forums
                - listitem [ref=e207]:
                  - link "Affiliate Program" [ref=e208] [cursor=pointer]:
                    - /url: /affiliate
            - generic [ref=e209]:
              - heading "Support" [level=3] [ref=e210]
              - list [ref=e211]:
                - listitem [ref=e212]:
                  - link "Help Center" [ref=e213] [cursor=pointer]:
                    - /url: /help
                - listitem [ref=e214]:
                  - link "Shipping Info" [ref=e215] [cursor=pointer]:
                    - /url: /shipping
                - listitem [ref=e216]:
                  - link "Returns Center" [ref=e217] [cursor=pointer]:
                    - /url: /returns
                - listitem [ref=e218]:
                  - link "Contact Us" [ref=e219] [cursor=pointer]:
                    - /url: /contact
        - generic [ref=e223]:
          - generic [ref=e224]:
            - generic [ref=e225]:
              - img [ref=e226]
              - text: Limited Access
            - heading "Don't Miss the Next Legendary Drop." [level=2] [ref=e228]:
              - text: Don't Miss the Next
              - text: Legendary Drop.
            - paragraph [ref=e229]: Join 50,000+ collectors receiving weekly market analysis, early access to pre-orders, and exclusive community discounts.
          - generic [ref=e230]:
            - generic [ref=e231]:
              - generic [ref=e232]:
                - img [ref=e233]
                - textbox "you@example.com" [ref=e236]
              - button "Join Now" [ref=e237]:
                - text: Join Now
                - img [ref=e238]
            - paragraph [ref=e240]:
              - img [ref=e241]
              - text: No spam, ever. Unsubscribe at any time.
        - generic [ref=e243]:
          - generic [ref=e244]:
            - link "Terms" [ref=e245] [cursor=pointer]:
              - /url: /terms
            - link "Privacy" [ref=e246] [cursor=pointer]:
              - /url: /privacy
            - link "Accessibility" [ref=e247] [cursor=pointer]:
              - /url: /accessibility
            - generic [ref=e248]:
              - img [ref=e249]
              - generic [ref=e252]: US / USD
              - img [ref=e253]
          - generic [ref=e255]:
            - img [ref=e256]
            - generic [ref=e258]: Mastercard
            - generic [ref=e259]: PayPal
            - generic [ref=e260]: Stripe
            - img [ref=e261]
          - generic [ref=e264]:
            - paragraph [ref=e265]: © 2026 PlayMoreTCG. All Rights Reserved.
            - paragraph [ref=e266]: The World's Favorite TCG Marketplace
  - button "Open Next.js Dev Tools" [ref=e272] [cursor=pointer]:
    - img [ref=e273]
  - alert [ref=e276]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Homepage', () => {
  4  |   test('should load and display hero content', async ({ page }) => {
  5  |     await page.goto('/', { waitUntil: 'networkidle' });
  6  | 
  7  |     // Check for hero heading
  8  |     await expect(page.getByText(/Your TCG Destination/i)).toBeVisible({ timeout: 10000 });
  9  |     
  10 |     // Check for "Shop Now" button
  11 |     const shopNowBtn = page.getByRole('link', { name: /Shop Now/i }).first();
  12 |     await expect(shopNowBtn).toBeVisible({ timeout: 10000 });
  13 |   });
  14 | 
  15 |   test('should navigate to products page', async ({ page }) => {
  16 |     await page.goto('/', { waitUntil: 'networkidle' });
  17 |     
  18 |     const shopNowBtn = page.getByRole('link', { name: /Shop Now/i }).first();
> 19 |     await shopNowBtn.click();
     |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20 | 
  21 |     // Check URL
  22 |     await expect(page).toHaveURL(/\/products/);
  23 |   });
  24 | });
  25 | 
```