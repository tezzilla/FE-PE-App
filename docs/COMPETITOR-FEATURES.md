# Competitor feature comparison (November 2026)

Based on vendor pages and review sites found by web search on 2026-11-18. Feature claims are mostly
the vendors' own marketing; verify before quoting them.

## What competitors offer

| Feature | PPI2Pass | School of PE | Achievable | PrepFE | CivilPrep today |
|---|---|---|---|---|---|
| Full-length timed practice exams | 5 × 110 questions | Yes | 3 full-length, timed | Timed and topic exams | Mock exam drawn from the bank, not yet 110 questions weighted like the exam |
| Problem count | 550 | Large bank | 570+ | Hundreds | 44 fixed + 45 generators (unlimited variants once approved) |
| Lessons (text or video) | Course | Video lectures | Online textbook | No | None |
| Adaptive practice / readiness | No | No | Yes (adaptive memory model) | Strengths and weaknesses breakdown | **Yes** (smart practice, spaced review, readiness) |
| Study plan / calendar | Learning Path, adjusts to weekly hours | Personalized study plan | Adaptive study plan | No | No |
| Custom quiz builder | Yes | Quiz generator (topics, count, difficulty) | No | Topic exams | Topic practice only |
| Diagnostic exam | Yes | No | No | No | Smart practice explores new topics, not a formal diagnostic |
| Flashcards | Yes | No | No | Yes (handbook) | No |
| Handbook references in solutions | Yes | Yes | Yes | Yes (section names) | Yes (section names) |
| Instructor Q&A | No | Instructor Connect (not on monthly) | No | No | Problem reports only |
| Pass guarantee | Some bundles | Yes (not monthly) | Yes | No | No |
| Mobile app | Unclear | Unclear | Web app | Web | **Yes (iOS/Android)** |
| Price (FE) | $1,195 to $1,795 | $349/mo to $1,999 | $999 | $80 to $120 | $29/mo or $69 / 3 mo |

## Where CivilPrep already wins
Price (10 to 30 times cheaper than full courses), adaptive practice that only Achievable markets (at
$999), unlimited generated problems, engineer-reviewed content with visible credit, a native mobile
app, and passes sized to real study periods.

## Gaps, in priority order

### Before launch (table stakes)
1. **Password reset and account emails.** Every competitor has it; we don't. Needs an email provider
   (e.g. Resend or Postmark).
2. **Full-length exam simulation like the real CBT.** 110 FE questions (80 PE) drawn by the NCEES topic
   weights, two sessions with the scheduled break, flag-and-review screen, per-topic score report.
   Show the reference handbook beside the questions: NCEES gives candidates the handbook free, so
   let users open their own downloaded copy in a split pane (we don't host NCEES's file).
3. **Bigger bank.** Competitors advertise 550+ problems. Generators give unlimited variants, but
   students judge by numbers they can see: show "X problem types, unlimited variants" and keep adding
   generators plus hand-written conceptual questions (ethics has none).

### High value, cheap for us (build on what exists)
4. **Study plan from the exam date.** Ask for the exam date and weekly hours; turn the readiness model
   into a weekly plan and daily targets, with an "on track / behind" status.
5. **Custom quiz builder and "review my misses".** Pick topics, count and time limit; one-click
   practice of everything you got wrong.
6. **Diagnostic test** at sign-up: ~2 questions per topic to seed readiness, then smart practice.
7. **Pacing stats.** Time per question vs the ~3 min (FE) / 6 min (PE) exam pace.
8. **Formula flashcards** with spaced repetition, written in our own words, pointing to handbook
   sections.

### Differentiators
9. **AI tutor on every solution** ("explain step 2", "why not B?"), grounded in the verified
   solution. Competitors charge for instructor Q&A; this is instant. Needs a Claude API key and usage
   limits.
10. **Topic review pages:** short original summaries per topic (key formulas, handbook section,
    common traps, a worked example generated from our templates).

### Later
11. Video lessons (expensive to produce), pass guarantee (wait for real pass-rate data), community
    features, SEO content (free sample questions, state licensure guides) to drive sign-ups.
