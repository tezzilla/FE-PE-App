# Pricing research: FE and PE Civil prep (November 2026)

Prices come from vendor pages and review sites found by web search on 2026-11-18. Sources often
disagree (sales, old pages), so treat figures as ranges and re-check before quoting them publicly.

## What candidates already pay
- NCEES exam fee: **FE $225**, **PE $400** (plus state board fees for the PE).
- Typical study time: **FE about 3 months** (200 to 300 hours, e.g. 3 hours a day for 12 to 14 weeks).
  **PE about 4 to 6 months** (about 300 hours, usually while working full time).

## Competitors

### Full courses (video lessons, instructors)
| Provider | FE Civil | PE Civil |
|---|---|---|
| PPI2Pass (Kaplan) | On-demand $1,195 (4 mo) to $1,495 (6 mo); monthly about $395; live $1,295 to $1,795 | On-demand up to about $2,795/yr; monthly about $545 |
| School of PE | On-demand $349/mo, $1,099 (4 mo), $1,499 (6 mo), $1,999 (12 mo); live $1,199 to $1,499 | On-demand about $499/mo; packages about $1,599 to $2,799 |
| Achievable (adaptive) | $999 one-time, pass guarantee (some pages show $199) | n/a |
| Civil Engineering Academy | $997 for 1 year (or 5 × $229) | $797 to $1,397 |

### Question banks and budget tools (closest to CivilPrep today)
| Provider | FE Civil | PE Civil |
|---|---|---|
| School of PE question bank | $139/mo | $139/mo or $399 for 4 mo |
| Study for FE | $299/mo, $1,199 for 6 mo | n/a |
| PrepFE | $79.99 (1 mo), $99.99 (3 mo), $119.99 (6 mo), one-time | n/a |
| PE Civil Click | $39.99 (1 mo), $89.99 (3 mo), $119.99 (6 mo), $189.99 (1 yr) | n/a |
| FE Interactive | $29.99/mo, $44.99 (3 mo), $59.99 (6 mo) | n/a |
| PEwise | n/a | $149 for 90 days (course plus practice exams) |
| Civil PE Practice | n/a | $69.99/mo, $149.99 for 90 days (older listing) |

## Where CivilPrep fits
CivilPrep is a practice platform (question bank, problem generators, adaptive smart practice, timed
mocks, readiness score), not a video course. Its natural competitors are the question banks, where
FE prices cluster at **$80 to $120 for a 3 to 6 month study period** and PE at **$140 to $400**.
Differentiators: adaptive practice (only Achievable markets this, at $999), unlimited generated
problems, and engineer-reviewed content. Gaps: no video lessons, a small bank today, a new brand.

## Findings that change the plan
1. **Monthly-only fits poorly.** Students study for a fixed 3 to 6 months, and most budget competitors
   sell one-time passes for that period. Offer exam-length passes next to monthly billing.
2. **All Access has little value.** The FE and PE are usually taken about 4 years apart, so almost
   nobody needs both at once.
3. **PE buyers are less price-sensitive.** They are working engineers, often reimbursed by their
   employer, and the PE market's cheapest serious options are $139/mo or $149 per 90 days.
4. **Our current FE price ($29/mo) is right for the market;** our PE price ($49/mo) is low.

## Recommended launch pricing
| Plan | Price | Typical total | Compare |
|---|---|---|---|
| FE Civil monthly | $29/mo | about $87 over 3 months | PrepFE $99.99/3 mo; PE Civil Click $89.99/3 mo |
| FE Civil 3-month pass | $69 one-time | $69 | Undercuts the budget tier; easy decision for students |
| PE Civil monthly | $59/mo | about $295 over 5 months | School of PE bank $139/mo |
| PE Civil 6-month pass | $249 one-time | $249 | School of PE bank $399/4 mo; about 10% of a full course |
| Firms (later) | Per-seat PE passes, invoiced | | Employers already pay $1,000+ per engineer for courses |

Also:
- **Drop All Access** at launch. Include FE content free with a PE plan, since PE candidates often
  refresh fundamentals.
- **Founding-member price** for the first 100 subscribers (for example FE $19/mo, PE $39/mo, locked for
  as long as they stay subscribed) in exchange for feedback and reviews while the bank grows.
- **Hold off on a pass guarantee** until there are real pass-rate data. It's a common feature
  (Achievable, PPI), but refund exposure is risky for a new product.
- **Revisit prices** once the bank is large (e.g. 500+ FE problems with every topic covered), when a
  move toward $35 to $39/mo FE becomes defensible.

**Status:** implemented on 2026-11-18 (passes, $59 PE, founding codes, All Access retired). Prices live in `lib/plans.ts`
(display) and Stripe (charged).
