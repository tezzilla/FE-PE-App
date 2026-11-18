# Content sourcing: what we may use

CivilPrep is a paid product, so every question must be content we're allowed to sell. Each question
and template carries a `provenance` (`original`, `public-domain`, `cc-by`, `cc-by-sa`); the validators
(`npm run test:content`, `npm run test:templates`) reject anything else.

## Allowed
- **Original problems.** Formulas, methods and engineering facts aren't copyrightable; specific problem
  text, figures and solution write-ups are. Write new problems in your own words and numbers. Cite any
  public method used in `provenance.basis` (e.g. "NRCS TR-55 eq. 3-3").
- **US federal government works** (17 U.S.C. §105), used as a source of methods and worked-example ideas:
  - FHWA Hydraulic Engineering Circulars and Hydraulic Design Series (e.g. HEC-22 Urban Drainage, HDS-5
    culverts), FHWA geotechnical and bridge manuals
  - USDA NRCS TR-55 and National Engineering Handbook
  - USACE Engineering Manuals, USGS and EPA technical guidance
  Check each document's front matter first: some contain copyrighted figures or text from contractors or
  other publishers, which are not public domain.
- **CC BY** (and **CC BY-SA**, if we're willing to share our adaptation of that item under CC BY-SA).
  Keep the attribution: title, author, license, link, and "adapted" if changed.

## Not allowed
- Questions from other prep companies or sites, even if shown "free" (PPI, School of PE, Achievable,
  PrepFE, YouTube channels, forums, Reddit, Quizlet, Scribd uploads).
- NCEES practice exams, the FE/PE reference handbooks' text and figures, and anything remembered from a
  real exam (the NCEES candidate agreement forbids sharing exam content).
- Textbook end-of-chapter problems, solution manuals, and university exams or homework (copyrighted).
- **NonCommercial (NC) or NoDerivatives (ND)** licenses. These cover most "open" engineering texts,
  including current OpenStax University Physics (CC BY-NC-SA), *Engineering Statics: Open and
  Interactive* (CC BY-NC-SA), and MIT OpenCourseWare (CC BY-NC-SA).
- "No license stated" means all rights reserved.

## Adding content
1. Prefer a template (`lib/templates/`): many variants, every answer computed, distractors from named
   mistakes.
2. Set `provenance`. For original work built on a public method, use `{ type: "original", basis: "..." }`.
3. Run `npm run test:templates` and `npm run test:content`, then check a few variants by hand.
4. A reviewer approves the template in `/review` before students see it.

Not legal advice. When in doubt about a source, leave it out or ask an IP attorney.
