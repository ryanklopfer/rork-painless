# Reconfigure workout progression: frequency-first graded exposure

## Overview

Rebuild how workouts are generated and progressed over time. The new system follows a **frequency → volume → intensity** progression model, where the number of training days increases first, then sets/reps grow, and finally weight goes up.

---

### **Features**

- [x] **User selects program length** during onboarding: choose from 5, 10, 15, or 20 weeks (replaces auto-calculated length)
- [x] **Frequency starts at 3 days/week** and gradually increases up to 7 days/week over the course of the program
- [x] **Progression order**: training days increase first → then sets/reps increase → then weight/intensity increases last
- [x] **Pain-gated progression**: if pain or sensitivity scores are too high, frequency does not increase that week — the program holds steady
- [x] **Same exercises every day** within a week, at the same intensity — no light/moderate/heavy rotation
- [x] **Deload every 5th week** (kept from current setup) — reduced volume and intensity
- [x] **Both cardio and resistance** exercises remain part of the program
- [x] **Exercises chosen by the user** during onboarding (kept from current setup)

---

### **How Progression Works (week by week)**

- [x] **Phase 1 — Frequency ramp-up:** Weeks start at 3 days/week, extra day added every ~2-3 weeks, pain-gated
- [x] **Phase 2 — Volume increase:** Once frequency plateaus, sets and reps increase gradually
- [x] **Phase 3 — Intensity increase:** After volume progresses, weight/intensity increases
- [x] **Deload weeks (every 5th week):** Frequency, volume, and intensity all drop back

---

### **Changes to screens**

- [x] **Onboarding**: Replace auto-calculated program length with picker showing 5 / 10 / 15 / 20 weeks
- [x] **Home screen**: Workout cards show "Week X ; Day Y" labels; day count reflects current week's frequency
- [x] **Workout detail screen**: Each day shows all exercises with that week's target sets, reps, and weight

---

### **What stays the same**

- [x] Exercise selection during onboarding (cardio + resistance presets)
- [x] Baseline entry for cardio duration and resistance sets/reps/weight
- [x] Deload every 5th week
- [x] Pain/check-in logging and its influence on progression
- [x] All existing tabs (Home, Pain, Load, Learn)
