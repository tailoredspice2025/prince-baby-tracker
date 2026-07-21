# DenBaby — monetization build plans (not built yet)

Two revenue streams, captured for later. Nothing here is implemented.
Sequencing principle: **launch free, build the audience, then monetize it.**

---

## Stream 1 — Premium feature unlock (one-time IAP)

### Model
Free core app forever; a **one-time ~$3–5 unlock** ("lifetime") for premium
features. Recommended premium set:
- **Family Sync** (multi-caregiver) — the natural paywall: highest-intent
  feature AND the only thing that costs us money (Firebase). Paywalling it
  means **free users cost nothing; payers fund their own cloud use.**
- **PDF export for pediatrician**.
- (Optional later) unlimited history / advanced trends.

### The unavoidable rule
Digital unlocks **must** use Apple In-App Purchase. As a small dev we get
the **Small Business Program 15%** rate → on $3, we net ~$2.55. External
payment links (12% US) aren't worth it at this price point.

### Money reality
10k users ≠ 10k × $3 unless it's paid-upfront (which crushes installs).
Freemium converts ~1–5%: 10k installs ≈ 100–500 payers. Revenue grows with
install volume; free tier drives that volume.

### Build steps (when ready)
1. **RevenueCat** SDK (free under ~$2.5k/mo revenue) — handles receipts,
   the Apple-required **"Restore Purchases"** button, family sharing.
2. Create a **non-consumable IAP** in App Store Connect ($2.99 tier).
3. Set up **Paid Apps agreement + banking/tax** in App Store Connect.
4. A small **paywall screen** shown when a free user taps a premium feature.
5. **Entitlement gate**: check the RevenueCat entitlement where Family Sync
   turns on (the "Invite caregiver" / "Join family" entry points) and on the
   PDF export button.
6. Submit the IAP for review alongside the app version that introduces it.

### Timing
Launch v1.0/v1.1 **free**. Introduce the unlock in a later version and
**grandfather early users** (anyone before date X keeps sync free) — charging
an unknown app from day one suppresses the growth that makes it pay.
Effort: ~1–2 focused days.

---

## Stream 2 — Newsletter / content (the Apple-free stream)

The new-parent / expecting-parent audience is one of the most valuable
advertising demographics (prams, formula, nappies, insurance, nursery). A
newsletter turns app users into a **media asset we own**, independent of the
app — and email revenue is **entirely outside Apple's cut**.

### Two delivery channels
- **A. In-app content feed** — a "Learn / This week" tab showing articles.
  Free content is fine with Apple. Pairs naturally with the pregnancy
  week-by-week idea.
- **B. Email newsletter** (BabyCentre-style) — weekly email. Fully outside
  Apple; no commission on any of its revenue.

### How it earns
1. **Sponsorships** — brands pay to reach engaged new parents. The big one,
   but needs scale (meaningful at thousands of subscribers, not hundreds).
2. **Affiliate** — product recommendations (bottles, prams via Amazon etc.).
   Physical-goods affiliate links are **allowed in-app and NOT subject to
   Apple's cut**. Works from day one, no audience minimum.
3. **Premium content tier** — paid articles. If sold/accessed in-app, that's
   IAP (15%). If email-only, it's outside Apple.

### The key constraint (brand + legal)
DenBaby today collects **no email, no account** — that's a core promise. A
newsletter needs email addresses, so it must be:
- **Strictly optional & opt-in** — a "Get weekly tips ✉️" capture, clearly
  separate from app usage; never gate app features behind it.
- **Privacy-law compliant (UK/EU GDPR)** — explicit consent, unsubscribe in
  every email, a data-processing agreement with the email tool, and a
  privacy-policy update describing email collection + the third-party sender.

### Tooling
- **Beehiiv** (built for newsletter monetization; has its own ad network) or
  ConvertKit / Mailchimp for the list + sending.
- In-app capture → a single opt-in field posting the email to the tool's API.
- Content: same sourcing question as pregnancy content — write conservative,
  clearly **non-medical** material grounded in public sources (NHS, WHO), or
  license a vetted set. Never diagnostic; always "consult your midwife".

### Build steps (when ready)
1. Add an **optional email opt-in** in the app (Profile or onboarding),
   posting to the newsletter tool's API. Store nothing locally beyond a
   "subscribed" flag.
2. Update the **privacy policy** for optional email collection + processor.
3. Stand up the newsletter in Beehiiv; write a repeatable weekly format.
4. Start monetizing with **affiliate** (immediate), add **sponsorships**
   once the list has scale.
5. (Later) surface the same content in an in-app "Learn" tab.

### Sequencing
Phase 3+ — after there's an audience. Affiliate can start small early;
sponsorships are a "once you have thousands of engaged parents" play.
