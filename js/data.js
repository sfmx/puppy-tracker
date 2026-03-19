/* ============================================================
   DATA — Puppy info, milestones, feeding guide, vet schedule
   ============================================================ */

export const PUPPY = {
  name: 'Ruby',
  breed: 'Maltese Shih Tzu',
  birthday: '2026-02-22',   // Born 22 Feb 2026 at 2am
  colour: 'TBD',
};

/* ── Puppy Age Helper ─────────────────────────────────────── */
export function getPuppyAge() {
  const born = new Date(PUPPY.birthday);
  const now = new Date();
  const diffMs = now - born;
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  const remainDays = days % 7;
  return { days, weeks, remainDays };
}

export function getPuppyAgeText() {
  const { weeks, remainDays } = getPuppyAge();
  if (weeks === 0) return `${remainDays} day${remainDays !== 1 ? 's' : ''} old`;
  return `${weeks}w ${remainDays}d old`;
}

/* ── Weaning Progress (4–8 weeks) ──────────────────────────── */
export function getWeaningProgress() {
  const { days } = getPuppyAge();
  // Weaning: starts ~28 days (4 wks), done by ~56 days (8 wks)
  const start = 28, end = 56;
  if (days < start) return 0;
  if (days >= end) return 100;
  return Math.round(((days - start) / (end - start)) * 100);
}

/* ── Feeding Guide by Week ─────────────────────────────────── */
export const feedingGuide = [
  { week: 4, meals: 4, texture: 'Sloppy porridge (kibble mush + milk replacer)', goal: 'Introduce food, not replace milk yet' },
  { week: 5, meals: 4, texture: 'Thicker mush (less water)', goal: 'Puppy starts eating more seriously' },
  { week: 6, meals: '3–4', texture: 'Mostly soft solids', goal: 'Only occasional nursing' },
  { week: 7, meals: 3, texture: 'Soft kibble, less mashing needed', goal: 'Almost fully weaned' },
  { week: 8, meals: 3, texture: 'Softened kibble', goal: 'Fully on solids, ready for new homes' },
  { week: 10, meals: 3, texture: 'Regular puppy kibble (may still soften)', goal: 'Regular feeding routine' },
  { week: 12, meals: 3, texture: 'Regular puppy kibble', goal: 'First vaccinations due' },
];

/* ── Feed Types ─────────────────────────────────────────────── */
export const feedTypes = [
  { id: 'mush',   label: 'Mush/Porridge', icon: '🥣', desc: 'Soaked kibble + water/milk replacer' },
  { id: 'wet',    label: 'Wet Food',      icon: '🥫', desc: 'Puppy wet food (mixed)' },
  { id: 'milk',   label: 'Milk/Bottle',   icon: '🍼', desc: 'Milk replacer or nursing' },
  { id: 'kibble', label: 'Dry Kibble',    icon: '🦴', desc: 'Softened or dry puppy kibble' },
];

export const feedAmounts = [
  '½ tbsp', '1 tbsp', '1½ tbsp', '2 tbsp', '3 tbsp', 'Small bowl',
];

export const feeders = ['Me', 'Wife', 'Sitter'];

/* ── Potty Types ────────────────────────────────────────────── */
export const pottyTypes = [
  { id: 'pee',      label: 'Pee',      icon: '💧' },
  { id: 'poo',      label: 'Poo',      icon: '💩' },
  { id: 'both',     label: 'Both',     icon: '💧💩' },
  { id: 'accident', label: 'Accident', icon: '⚠️' },
];

export const pottyLocations = ['Puppy pad', 'Outside', 'Inside (accident)', 'Newspaper'];

/* ── Sleep States ───────────────────────────────────────────── */
export const sleepActions = [
  { id: 'sleep', label: '😴 Fell Asleep', icon: '🌙' },
  { id: 'wake',  label: '👀 Woke Up',     icon: '☀️' },
];

/* ── Milestones ─────────────────────────────────────────────── */
export const milestones = [
  // Week 1–2
  { id: 'eyes-open',       week: 2,  label: 'Eyes opened',           icon: '👀' },
  { id: 'ears-open',       week: 2,  label: 'Ears opened',           icon: '👂' },
  // Week 3
  { id: 'first-steps',     week: 3,  label: 'First wobbly steps',    icon: '🐾' },
  { id: 'first-teeth',     week: 3,  label: 'Baby teeth emerging',   icon: '🦷' },
  { id: 'first-bark',      week: 3,  label: 'First bark/vocalisation', icon: '🗣️' },
  // Week 4
  { id: 'first-solid',     week: 4,  label: 'First solid food',      icon: '🥣' },
  { id: 'walking-steady',  week: 4,  label: 'Walking more steadily', icon: '🚶' },
  { id: 'playing',         week: 4,  label: 'Playing with people/toys', icon: '🧸' },
  // Week 5
  { id: 'running',         week: 5,  label: 'Running & pouncing',    icon: '🏃' },
  { id: 'socialising',     week: 5,  label: 'Socialising with people', icon: '🤝' },
  { id: 'eating-well',     week: 5,  label: 'Eating solid food well', icon: '🍽️' },
  // Week 6
  { id: 'less-nursing',    week: 6,  label: 'Nursing much less',     icon: '🍼' },
  { id: 'house-training',  week: 6,  label: 'Starting house training', icon: '🏠' },
  // Week 7–8
  { id: 'fully-weaned',    week: 8,  label: 'Fully weaned',          icon: '🎉' },
  { id: 'first-bath',      week: 8,  label: 'First bath',            icon: '🛁' },
  { id: 'ready-home',      week: 8,  label: 'Ready for new home',    icon: '🏡' },
  // Post 8 weeks
  { id: 'first-vacc',      week: 8,  label: 'First vaccination (6–8wk)', icon: '💉' },
  { id: 'second-vacc',     week: 12, label: 'Second vaccination (10–12wk)', icon: '💉' },
  { id: 'third-vacc',      week: 16, label: 'Third vaccination (14–16wk)', icon: '💉' },
  { id: 'microchip',       week: 12, label: 'Microchipped',          icon: '📡' },
  { id: 'desex',           week: 24, label: 'Desexing (discuss with vet)', icon: '✂️' },
];

/* ── Vaccination Schedule (QLD) ─────────────────────────────── */
export const vaccinationSchedule = [
  { id: 'vacc-c3-1', week: 6,  name: 'C3 (1st)', desc: 'Distemper, Hepatitis, Parvovirus', required: true },
  { id: 'vacc-c3-2', week: 10, name: 'C3 (2nd)', desc: 'Booster — Distemper, Hepatitis, Parvovirus', required: true },
  { id: 'vacc-c3-3', week: 14, name: 'C3 (3rd)', desc: 'Final puppy booster', required: true },
  { id: 'vacc-c5',   week: 14, name: 'C5 (optional)', desc: 'C3 + Bordetella + Parainfluenza (kennel cough)', required: false },
  { id: 'worm-1',    week: 2,  name: 'Worming (2wk)', desc: 'Every 2 weeks until 12 weeks', required: true },
  { id: 'worm-2',    week: 4,  name: 'Worming (4wk)', desc: 'Every 2 weeks until 12 weeks', required: true },
  { id: 'worm-3',    week: 6,  name: 'Worming (6wk)', desc: 'Every 2 weeks until 12 weeks', required: true },
  { id: 'worm-4',    week: 8,  name: 'Worming (8wk)', desc: 'Every 2 weeks until 12 weeks', required: true },
  { id: 'worm-5',    week: 10, name: 'Worming (10wk)', desc: 'Every 2 weeks until 12 weeks', required: true },
  { id: 'worm-6',    week: 12, name: 'Worming (12wk)', desc: 'Then monthly until 6 months', required: true },
  { id: 'flea',      week: 8,  name: 'Flea prevention', desc: 'Start flea treatment (check age on product)', required: true },
];

/* ── Tab Labels ─────────────────────────────────────────────── */
export const tabLabels = {
  feeding: 'Feeding Log',
  weight: 'Weight Tracker',
  potty: 'Potty Log',
  sleep: 'Sleep Log',
  health: 'Health & Vet',
  milestones: 'Milestones',
};
