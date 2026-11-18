# Exam coverage map

Sources: NCEES FE Civil CBT specification (effective July 2020) and the five PE Civil module
specifications (knowledge areas effective April 2024; design standards effective April 2027).
Last reviewed November 2026. Links live in `lib/content/resources.ts`. We link to NCEES documents and
never host them.

"Templates" are problem types that generate unlimited numeric variants (`lib/templates/`), each re-solved
by an independent checker (`lib/templates/verify.ts`). "Fixed" questions are hand-written (`lib/content/`).

## Exam format

| | FE Civil | PE Civil (any module) |
|---|---|---|
| Questions | 110 | 80 |
| Time | 6 h (incl. tutorial and break) | 9 h (incl. tutorial and break) |
| Reference | FE Reference Handbook (electronic) | PE Civil Reference Handbook plus the module's design standards (electronic) |
| Units | SI and USCS | SI and USCS |
| Style | Mostly single-concept | Multi-step design, analysis and application; heavy use of codes |

## FE Civil (July 2020 specification)

| # | Knowledge area | Exam Qs | Templates | What we cover | Main gaps |
|---|---|---|---|---|---|
| 1 | Mathematics & Statistics | 8–12 | 2 | Standard deviation, interpolation | Analytic geometry, calculus, vectors, regression and confidence intervals |
| 2 | Ethics & Professional Practice | 4–6 | 0 (fixed only) | Codes of ethics, licensure | More contracts/liability scenarios (fixed questions; not numeric) |
| 3 | Engineering Economics | 5–8 | 4 | P/A, F/P, depreciation, break-even | Benefit-cost ratio, rate of return, expected value |
| 4 | Statics | 8–12 | 5 | Reactions, resultants, truss joints, centroids, friction | Area moment of inertia (parallel axis), frames |
| 5 | Dynamics | 4–6 | 3 | Projectiles, braking, work-energy (spring) | Mass moment of inertia, rigid-body kinetics |
| 6 | Mechanics of Materials | 7–11 | 5 | Axial, bending, torsion, principal stress, max moment | Shear stress (VQ/Ib), shear/moment diagram reading |
| 7 | Materials | 5–8 | 2 | Thermal expansion, w/c ratio | Concrete and asphalt mix design, stress-strain properties |
| 8 | Fluid Mechanics | 6–9 | 5 | Continuity, hydrostatics, Darcy, weirs, venturi | Buoyancy, momentum (force on a bend) |
| 9 | Surveying | 6–9 | 4 | Leveling, departures, curve length, PT stationing | Area by coordinates, earthwork average-end-area |
| 10 | Water Resources & Environmental | 10–15 | 16 | Hydrology, Manning, BOD, wells, pumps, hardness | Detention routing, softening chemistry |
| 11 | Structural | 10–15 | 2 | Euler buckling, beam deflection | Determinacy, influence lines, tributary area |
| 12 | Geotechnical | 10–15 | 4 | Effective stress, Rankine, phase, consolidation time | USCS classification, Proctor/compaction, bearing capacity |
| 13 | Transportation | 9–14 | 4 | SSD, flow-density, crest curves, HCM flow rate | Superelevation, pavement ESALs, trip generation |
| 14 | Construction | 8–12 | 4 | Truck loads, earned value, fleet sizing, EAC | CPM float, cost estimating |

## PE Civil: Water Resources & Environmental

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Project Planning | 4–6 | Shared economics/EV templates |
| 2 | Soil Mechanics | 3–5 | Geotech templates (effective stress, Rankine, settlement) |
| 3 | Materials | 4–6 | Gap: piping materials, soil classification |
| 4 | Analysis & Design (mass balance, loading, flow measurement) | 6–9 | Detention time, clarifier overflow rate, contracted weir |
| 5 | Hydraulics: Closed Conduit | 7–11 | Continuity, Darcy, Hazen-Williams (US), **pump system power (multi-step)** |
| 6 | Hydraulics: Open Channel | 7–11 | Manning, critical depth, Froude, gutter flow, **hydraulic jump energy loss** |
| 7 | Hydrology | 8–12 | Rational, NRCS CN, TR-55 sheet and shallow flow |
| 8 | Groundwater & Wells | 4–6 | **Thiem confined drawdown** |
| 9 | Surface & Groundwater Quality | 5–8 | BOD exertion, BOD dilution, **Streeter-Phelps DO after mixing (multi-step)** |
| 10 | Drinking Water | 6–9 | **CT with baffling factor**, **total hardness** |
| 11 | Wastewater | 7–11 | Clarifier loading. Gap: activated sludge (SRT, F/M), nutrient removal |
| 12 | Project Sitework | 9–14 | Earthwork, curve elements. Gap: erosion control |

## PE Civil: Structural

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Loads & Load Applications | 12–18 | **Governing LRFD combination**. Gap: wind/seismic base shear, tributary area |
| 2 | Forces & Load Effects | 17–26 | Max moment, fixed-end moment, **deflection (US units)** |
| 3 | Temporary Structures | 5–8 | Formwork pressure (shared with Construction) |
| 4 | Materials | 10–15 | Gap: timber and masonry adjustment factors |
| 5 | Component Design & Detailing | 26–39 | RC flexure (ACI 318-19 φ), required Z, **AISC column φPn**, **H1 interaction**, **RC shear φVc**. Gap: bolted/welded connections, footing design |

## PE Civil: Geotechnical

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Site Characterization | 8–12 | Gap: SPT corrections, RQD |
| 2 | Soil Mechanics & Lab Testing | 8–12 | Effective stress, phase relations |
| 3 | Construction QA/QC & Safety | 6–9 | Gap: relative compaction |
| 4 | Earthquake & Dynamic Loads | 5–8 | Gap: liquefaction CSR |
| 5 | Earth Structures & Pavement | 9–14 | **Infinite slope with seepage** |
| 6 | Groundwater & Seepage | 4–6 | Gap: flow nets |
| 7 | Problematic Soils | 4–6 | Gap (mostly conceptual; fixed questions) |
| 8 | Retaining Structures | 10–15 | Rankine active thrust. Gap: sliding/overturning FS |
| 9 | Shallow Foundations | 6–9 | **Strip footing bearing with water table**, NC clay settlement, **consolidation time** |
| 10 | Deep Foundations | 10–15 | **Pile capacity in clay (α method)** |

## PE Civil: Transportation

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Project Management | 6–9 | Shared economics/EV |
| 2 | Traffic Engineering | 10–15 | **HCM demand flow rate (PHF, fHV)**, Webster cycle |
| 3 | Roadside & Cross-Section | 7–11 | Gap: clear zone |
| 4 | Horizontal Design | 8–12 | Curve length, **PT stationing**. Gap: superelevation, middle ordinate |
| 5 | Vertical Design | 8–12 | **Crest curve for SSD**, **sag curve (headlight)** |
| 6 | Intersection Geometry | 7–11 | Gap: intersection sight distance |
| 7 | Traffic Signals | 5–8 | Webster cycle. Gap: yellow/all-red clearance |
| 8 | Traffic Control Design | 5–8 | Gap (MUTCD; mostly conceptual) |
| 9 | Geotechnical & Pavement | 6–9 | Gap: ESALs, structural number |
| 10 | Drainage | 8–12 | Shared hydrology/gutter flow templates |

## PE Civil: Construction

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Soil Mechanics | 6–9 | Shared geotech templates |
| 2 | Site Layout | 5–8 | Gap: staking and grades |
| 3 | Material Properties | 5–8 | Gap: concrete mix proportioning |
| 4 | Estimating Quantities & Costs | 6–9 | Truck loads, **EAC forecast** |
| 5 | Planning & Scheduling | 7–11 | Gap: CPM float, crashing (time-cost trade-off) |
| 6 | Quality Control | 7–11 | Gap: maturity method |
| 7 | Structural Mechanics | 7–11 | Shared structural templates |
| 8 | Hydraulics & Hydrology | 4–6 | Shared hydrology templates |
| 9 | Operations & Methods | 9–14 | **Haul fleet sizing**. Gap: crane outrigger loads, dewatering |
| 10 | Support of Construction Loads | 10–15 | **Wall formwork pressure (ACI 347)**. Gap: shoring, trench/SOE |
| 11 | Health & Safety | 4–6 | Gap (OSHA; fixed questions) |

**Bold** = added in the November 2026 batch (32 new problem types).

## Next batch (highest exam weight with no coverage)

1. Structural connections: bolt shear and bearing, fillet weld strength (Structural 5D, 26–39 Qs area).
2. Wind and seismic base shear, tributary area (Structural 1, 12–18 Qs).
3. CPM float and time-cost crashing (Construction 5, 7–11 Qs).
4. Retaining wall sliding and overturning (Geotechnical 8, 10–15 Qs).
5. Activated sludge SRT and F/M (WRE 11, 7–11 Qs).
6. Superelevation and middle ordinate (Transportation 4, 8–12 Qs).
7. Pavement ESALs and structural number (Transportation 9 and FE 13).
8. Liquefaction CSR and SPT corrections (Geotechnical 1 and 4).
