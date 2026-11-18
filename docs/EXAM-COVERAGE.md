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
| 3 | Engineering Economics | 5–8 | 5 | P/A, F/P, depreciation, break-even, benefit-cost | Rate of return, expected value |
| 4 | Statics | 8–12 | 6 | Reactions, resultants, truss joints, centroids, friction, parallel-axis inertia | Frames |
| 5 | Dynamics | 4–6 | 3 | Projectiles, braking, work-energy (spring) | Mass moment of inertia, rigid-body kinetics |
| 6 | Mechanics of Materials | 7–11 | 5 | Axial, bending, torsion, principal stress, max moment | Shear stress (VQ/Ib), shear/moment diagram reading |
| 7 | Materials | 5–8 | 2 | Thermal expansion, w/c ratio | Concrete and asphalt mix design, stress-strain properties |
| 8 | Fluid Mechanics | 6–9 | 5 | Continuity, hydrostatics, Darcy, weirs, venturi | Buoyancy, momentum (force on a bend) |
| 9 | Surveying | 6–9 | 5 | Leveling, departures, curve length, PT stationing, average end area | Area by coordinates |
| 10 | Water Resources & Environmental | 10–15 | 16 | Hydrology, Manning, BOD, wells, pumps, hardness | Detention routing, softening chemistry |
| 11 | Structural | 10–15 | 5 | Euler buckling, deflection, tributary loads, welds, bolts | Determinacy, influence lines |
| 12 | Geotechnical | 10–15 | 6 | Effective stress, Rankine, phase, consolidation time, wall sliding, flow nets | USCS classification, Proctor/compaction, bearing capacity |
| 13 | Transportation | 9–14 | 6 | SSD, flow-density, crest curves, HCM flow rate, superelevation, ESALs | Trip generation |
| 14 | Construction | 8–12 | 5 | Truck loads, earned value, fleet sizing, EAC, CPM float | Cost estimating |

## PE Civil: Water Resources & Environmental

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Project Planning | 4–6 | Shared economics/EV templates |
| 2 | Soil Mechanics | 3–5 | Geotech templates (effective stress, Rankine, settlement) |
| 3 | Materials | 4–6 | Gap: piping materials, soil classification |
| 4 | Analysis & Design (mass balance, loading, flow measurement) | 6–9 | Detention time, clarifier overflow rate, contracted weir |
| 5 | Hydraulics: Closed Conduit | 7–11 | Continuity, Darcy, Hazen-Williams (US), pump system power (multi-step) |
| 6 | Hydraulics: Open Channel | 7–11 | Manning, critical depth, Froude, gutter flow, hydraulic jump energy loss |
| 7 | Hydrology | 8–12 | Rational, NRCS CN, TR-55 sheet and shallow flow |
| 8 | Groundwater & Wells | 4–6 | Thiem confined drawdown |
| 9 | Surface & Groundwater Quality | 5–8 | BOD exertion, BOD dilution, Streeter-Phelps DO after mixing (multi-step) |
| 10 | Drinking Water | 6–9 | CT with baffling factor, total hardness |
| 11 | Wastewater | 7–11 | Clarifier loading, **SRT**, **F/M**, **aeration basin volume**. Gap: nutrient removal, sludge digestion |
| 12 | Project Sitework | 9–14 | Earthwork, curve elements. Gap: erosion control |

## PE Civil: Structural

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Loads & Load Applications | 12–18 | Governing LRFD combination, **seismic base shear (ELF)**, **tributary girder loads**. Gap: wind pressures |
| 2 | Forces & Load Effects | 17–26 | Max moment, fixed-end moment, deflection (US units) |
| 3 | Temporary Structures | 5–8 | Formwork pressure (shared with Construction) |
| 4 | Materials | 10–15 | Gap: timber and masonry adjustment factors |
| 5 | Component Design & Detailing | 26–39 | RC flexure (ACI 318-19 φ), required Z, AISC column φPn, H1 interaction, RC shear φVc, **fillet welds**, **bolt shear vs. bearing**. Gap: footing design, timber/masonry |

## PE Civil: Geotechnical

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Site Characterization | 8–12 | **SPT (N₁)₆₀**. Gap: RQD |
| 2 | Soil Mechanics & Lab Testing | 8–12 | Effective stress, phase relations |
| 3 | Construction QA/QC & Safety | 6–9 | Gap: relative compaction |
| 4 | Earthquake & Dynamic Loads | 5–8 | **Liquefaction CSR** |
| 5 | Earth Structures & Pavement | 9–14 | Infinite slope with seepage |
| 6 | Groundwater & Seepage | 4–6 | **Flow net seepage** |
| 7 | Problematic Soils | 4–6 | Gap (mostly conceptual; fixed questions) |
| 8 | Retaining Structures | 10–15 | Rankine active thrust, **sliding FS**, **overturning FS**. Gap: braced and anchored walls |
| 9 | Shallow Foundations | 6–9 | Strip footing bearing with water table, NC clay settlement, consolidation time |
| 10 | Deep Foundations | 10–15 | Pile capacity in clay (α method) |

## PE Civil: Transportation

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Project Management | 6–9 | Shared economics/EV |
| 2 | Traffic Engineering | 10–15 | HCM demand flow rate (PHF, fHV), Webster cycle |
| 3 | Roadside & Cross-Section | 7–11 | Gap: clear zone |
| 4 | Horizontal Design | 8–12 | Curve length, PT stationing, **minimum radius (superelevation)**, **sight clearance (middle ordinate)** |
| 5 | Vertical Design | 8–12 | Crest curve for SSD, sag curve (headlight) |
| 6 | Intersection Geometry | 7–11 | Gap: intersection sight distance |
| 7 | Traffic Signals | 5–8 | Webster cycle. Gap: yellow/all-red clearance |
| 8 | Traffic Control Design | 5–8 | Gap (MUTCD; mostly conceptual) |
| 9 | Geotechnical & Pavement | 6–9 | **Design-lane ESALs**, **base thickness from SN** |
| 10 | Drainage | 8–12 | Shared hydrology/gutter flow templates |

## PE Civil: Construction

| # | Knowledge area | Exam Qs | Covered by |
|---|---|---|---|
| 1 | Soil Mechanics | 6–9 | Shared geotech templates |
| 2 | Site Layout | 5–8 | Gap: staking and grades |
| 3 | Material Properties | 5–8 | Gap: concrete mix proportioning |
| 4 | Estimating Quantities & Costs | 6–9 | Truck loads, EAC forecast, **average end area** |
| 5 | Planning & Scheduling | 7–11 | **CPM total float**, **least-cost crashing** |
| 6 | Quality Control | 7–11 | Gap: maturity method |
| 7 | Structural Mechanics | 7–11 | Shared structural templates |
| 8 | Hydraulics & Hydrology | 4–6 | Shared hydrology templates |
| 9 | Operations & Methods | 9–14 | Haul fleet sizing. Gap: crane outrigger loads, dewatering |
| 10 | Support of Construction Loads | 10–15 | Wall formwork pressure (ACI 347). Gap: shoring, trench/SOE |
| 11 | Health & Safety | 4–6 | Gap (OSHA; fixed questions) |

**Bold** = added in the second November 2026 batch (21 problem types). The first batch added 32.

## Third batch (November 2026)

Problem types (13): windward wall wind pressure; footing punching and one-way shear; braced cut strut
load; crane outrigger mat area; borrow volume and water to add for compaction; yellow plus red
clearance interval; intersection sight distance; primary sludge volume; nitrification oxygen demand;
unit hydrograph peak with NRCS runoff; triangular-hydrograph detention storage.

Hand-written conceptual questions (47, `lib/content/concepts.ts`): ethics and contracts (expert
testimony, comity, E&O insurance, lump sum, liquidated damages), project delivery (design-build, CMAR),
OSHA excavation and fall protection (5 ft, 20 ft, 4 ft/25 ft egress, 2 ft spoil, Type A/B/C slopes, 6 ft
fall protection, competent person), MUTCD (warning sign colors, yellow vs. white markings, TTC zone
areas, taper length), roadside recoverable slopes, crash rates, USCS classification, sensitivity, RQD,
quick condition, frost heave, expansive clays, coagulation, DBPs, softening, SVI, nitrification
alkalinity, breakpoint chlorination, TMDL, cavitation, determinacy, influence lines, ASCE 7 risk
category, NDS load duration, IBC special inspections.

## Fourth batch (November 2026)

Problem types (15): parallel pipes (Hazen-Williams), pipes in series (Darcy), sewer full-flow capacity
and minimum slope, timber joist allowable moment and timber column capacity (NDS), pile group
efficiency, earthwork waste with shrinkage, AASHTO group index, orifice discharge, floating block
freeboard, force on a pipe bend, area by coordinates, disk spin-up time, beam shear stress at a point.

Conceptual questions (33): compaction tests, AASHTO subgrade ratings, slump, 0.2% offset yield,
toughness, exceedance probability, time of concentration, adding decibels, indicator organisms, the
four-step travel model, state plane projections, contours, signal warrants, sign shapes, ADA curb
ramps, roundabout right-of-way, ACI cylinder acceptance, bolt pretensioning methods, weld NDT,
reshoring, crane load charts, Shelby tubes, CPT, liquefaction susceptibility, seismic site class,
infiltration vs. inflow, fire flow pressure, reverse osmosis, bioretention, braced frames,
post-tensioning.

## Fifth batch (November 2026)

Problem types (13): superelevation runoff length, vertical curve elevation, crest high point,
composite beam φMn, bolted plate tension (yield vs. rupture), unconfined Thiem yield, two-well
superposition, clarifier solids loading, aeration oxygen demand, wall thrust with surcharge and water,
overconsolidated clay settlement, 2:1 stress distribution, linear schedule crew lag.

## Sixth batch (November 2026)

Problem types (16): CMU wall axial capacity (ASD), cantilever deflection, culvert outlet control
headwater, Muskingum routing, rapid mix power, filter count with redundancy, drilled shaft β method,
degree of saturation, falling-head permeability, axle load equivalency, pedestrian phase time, curve
external distance, concrete mix design (absolute volume), rate of return, capitalized cost, impulse.

Conceptual questions (27): FE math (derivative, determinant, dot product, normal distribution, R²,
distance), sunk cost, expected value, two-force members, impending friction, rigid body kinematics,
HSM CMFs, HCM LOS measures, Stage 2 DBP MCLs, digester gas, biological P removal, urbanization and
hydrographs, downdrag, wick drains, seismic design category, lateral-torsional bracing, development
length, free float, linear schedule slopes, crashing order.

## Seventh batch (November 2026)

Problem types (15): inelastic lateral-torsional buckling, tied column φPn,max, steel beam shear, one-way
slab minimum thickness, unit hydrograph convolution, NRCS lag time of concentration, V-notch weir,
storm sewer sizing to standard pipe sizes, cantilever sheet pile embedment, passive thrust with
cohesion, undrained bearing on clay, critical v/c (Xc), incident queue delay, two-leg sling tension,
excavator production in BCY.

## PE module structure (November 2026)

`lib/content/pe-spec.ts` holds every knowledge area of the five PE Civil module exams (April 2024 spec):
question range, NCEES sub-topics, and the CivilPrep questions and calculation problems mapped to each.
It drives the module pages (/exams/pe-civil/modules/[module]), practice by knowledge area, smart
practice weights for a chosen module, and the area-by-area blueprint of the 80-question timed exam.
Areas marked "more coming" on the module pages are the next content priority.

Eighth batch (11): segment crash rate, design hourly volume, work zone taper length, triaxial friction
angle, sand cone relative compaction, RQD from core pieces, flat roof snow load, RUSLE soil loss, concrete
maturity, grade stake cut, pressure pipe wall thickness.

## Ninth batch (November 2026)

Problem types (13): liquefaction factor of safety, pseudo-static infinite slope, heave from exit
gradient, MSE reinforcement tension, pile elastic shortening, shoring post load, left-turn storage,
Cooper-Jacob drawdown, groundwater travel time, TMDL load reduction, propped cantilever, dewatering pump
power, EUAC. Conceptual (18): collapsible soils, karst, peat, sulfate exposure, rock slope kinematics,
site amplification, clear zones, barrier warrants and deflection, PROWAG widths, roundabout safety,
conflict points, intersection skew, TTC buffer space, ACI 347 lateral bracing load, submittal review,
unconfined storativity, image wells. Every PE knowledge area now has at least 5 mapped items.

## Tenth batch (November 2026)

Problem types (11): liquidity index, compression index from oedometer data, FHWA-modified Gates driving
formula, Davisson offset line, sign letter height, pavement marking quantities, slope stake offset,
Streeter-Phelps minimum DO, two-axle maximum moment, live load reduction, distribution storage volume.
Conceptual (8): unconfined compression, pile setup, high-strain dynamic testing, crosshole sonic
logging, sign mounting height, retroreflectivity, offset stakes, grade stake markings.

## Eleventh batch (November 2026)

Problem types (12): eccentric bolt group (elastic method), prestress elastic shortening loss, two-way
flat plate minimum thickness, lime softening dose, sludge thickening volume, chlorine contact basin
volume, gravity thickener diameter, spiral curve length, roundabout entry v/c, M/M/1 toll queue wait,
geotextile AOS retention, equipment ownership cost.

## Twelfth batch (November 2026)

Problem types (11): shear wall hold-down uplift, base plate bearing (AISC J8), tension development length,
web local yielding, filter backwash share, ion exchange run volume, landfill leachate balance, trickling
filter organic loading, EPDO crash index, concrete pump placement time, rock socket side resistance.

## Thirteenth batch (November 2026)

Problem types (12): nonsway moment magnification, wood bolt group capacity (NDS), base plate thickness,
sequent peak reservoir storage, sediment basin area from Stokes' law, pressure at a network node,
parking peak accumulation, walkway pedestrian space, 85th percentile speed, space-mean speed,
cost-loaded cumulative planned value, preload surcharge time.

## Fourteenth batch (November 2026)

Problem types (11): sway frame moment magnification, timber beam stability factor CL, Hardy Cross loop
correction, pump operating point, Gumbel flood frequency, signal uniform delay (D/D/1), learning curve
unit time, cost index with capacity scaling, crane lift percent of capacity, dynamic compaction depth,
MSE geogrid pullout.

## Fifteenth batch (November 2026)

Problem types (11): block shear, shear studs for full composite action, Coulomb active thrust,
Mononobe-Okabe seismic thrust, secondary compression, infiltration trench length, aerated grit chamber,
lift station wet well volume, freeway merge flow (vR12), required superelevation, earthwork overhaul.

## Sixteenth batch (November 2026)

Problem types (12): cracked beam deflection with Ie, retaining wall stem moment, linear reservoir routing,
water hammer, orifice outlet diameter, gravity model trips, crest curve available SSD, speed from skid
marks, form tie spacing, cost-plus-incentive fee, braced cut in clay (Peck), pile group settlement.

## Seventeenth batch (November 2026)

Problem types (12): elastic LTB, concrete T-beam, spiral reinforcement ratio, timber beam shear, water
main sizing, rational method with IDF equation, breakpoint chlorine feed, digester methane, trip
generation regression, density from detector occupancy, required rimpull, roller production.

## Next batch

1. Structural: masonry wall shear, concrete beam deflection with Ie, cantilever retaining wall stem moment.
2. WRE: culvert inlet control, reservoir routing (storage-indication), water hammer pressure rise.
3. Transportation: trip distribution (gravity model), pavement rigid slab thickness checks.
4. Construction: concrete form tie spacing, cost-plus contract fee comparisons.
5. Geotechnical: braced cut in clay (Peck), group settlement of piles (equivalent footing).
