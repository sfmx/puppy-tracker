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
  { week: 3, meals: 0, texture: 'Mother\'s milk only', goal: 'No solids yet - nursing every 2-3 hours',
    foods: ['Mother\'s milk or puppy milk replacer (e.g. Wombaroo, Di-Vetelact)'],
    amount: 'Ad lib (on demand from mum)',
    recipe: null,
    tips: ['Keep mum well-fed with puppy-grade food so her milk is rich', 'If bottle feeding: 1–2ml per feed, every 2–3 hours including overnight', 'Warm milk replacer to ~38°C (body temp)'] },
  { week: 4, meals: 4, texture: 'Sloppy porridge (kibble mush + milk replacer)', goal: 'Introduce food — not replacing milk yet',
    foods: ['Puppy kibble (Royal Canin Mini Starter, Hills Science Diet Puppy Small, or Advance Puppy Small Breed)', 'Puppy milk replacer', 'Warm water'],
    amount: '½–1 tablespoon per meal (total ~2–4 tbsp/day)',
    recipe: 'Soak ¼ cup puppy kibble in warm water + 1 tbsp milk replacer for 15 min. Mash with a fork until porridge consistency. Serve lukewarm.',
    tips: ['Put a tiny bit on your finger and let Ruby lick it', 'Don\'t worry if she only licks and plays — she\'s still nursing', 'Offer 4 times a day: morning, midday, afternoon, evening', 'Clean her face after — she\'ll be messy!'] },
  { week: 5, meals: 4, texture: 'Thicker mush (less water)', goal: 'Ruby starts eating more seriously',
    foods: ['Puppy kibble (soaked less)', 'Puppy wet food (e.g. Royal Canin Mini Puppy wet)', 'Puppy milk replacer (less needed now)'],
    amount: '1–2 tablespoons per meal (total ~4–8 tbsp/day)',
    recipe: 'Soak kibble for 10 min instead of 15. Mash less — some small soft chunks OK. Can mix in 1 tsp puppy wet food for flavour.',
    tips: ['She should be lapping from a shallow dish now', 'Still nursing from mum but less frequently', 'Keep meals small — tiny tummy!', 'Consistent schedule helps digestion'] },
  { week: 6, meals: '3–4', texture: 'Mostly soft solids', goal: 'Only occasional nursing',
    foods: ['Puppy kibble (lightly soaked 5 min)', 'Puppy wet food', 'Plain cooked chicken (shredded fine)', 'Cooked pumpkin (1 tsp — good for digestion)'],
    amount: '2–3 tablespoons per meal (total ~6–12 tbsp/day)',
    recipe: 'Soak kibble 5 min in warm water (just enough to soften). Mix with 1 tbsp wet food. Can add tiny amount of shredded cooked chicken breast.',
    tips: ['Can start reducing to 3 meals if she\'s eating well', 'First C3 vaccination is due this week', 'First worming dose due — check with vet', 'Fresh water available at all times'] },
  { week: 7, meals: 3, texture: 'Soft kibble, less mashing needed', goal: 'Almost fully weaned',
    foods: ['Puppy kibble (barely soaked — just dampened)', 'Puppy wet food (as topper)', 'Plain cooked chicken or fish', 'Small amount of cooked sweet potato or carrot'],
    amount: '2–3 tablespoons per meal (total ~6–9 tbsp/day)',
    recipe: 'Dampen kibble with a splash of warm water. Top with 1 tsp wet food. Ruby should be crunching some kibble now.',
    tips: ['Mum will be pushing her away from nursing — totally normal', 'If she\'s not interested in a meal, skip it and try next time', 'Don\'t give cow\'s milk — causes diarrhoea'] },
  { week: 8, meals: 3, texture: 'Softened kibble', goal: 'Fully weaned — on solids only',
    foods: ['Puppy kibble (can try dry or lightly dampened)', 'Puppy wet food', 'Lean cooked meat (chicken, turkey, fish)', 'Puppy training treats (tiny pieces)'],
    amount: '3–4 tablespoons per meal (total ~9–12 tbsp/day, or ~¼ cup dry kibble/day)',
    recipe: 'Serve kibble dry or with a tiny splash of warm water. Mix in 1 tbsp wet food if needed for interest. She may prefer dry by now!',
    tips: ['Fully weaned — no more nursing needed', 'Stick to 3 meals at consistent times', 'Start using tiny kibble pieces as training treats', 'Worming due this week'] },
  { week: 10, meals: 3, texture: 'Regular puppy kibble (may still soften)', goal: 'Regular feeding routine established',
    foods: ['Puppy kibble (dry)', 'Puppy wet food (as occasional topper)', 'Safe raw or cooked veg: carrot, green beans, pumpkin', 'Lean cooked meat'],
    amount: '~¼–⅓ cup dry kibble per day split across 3 meals',
    recipe: 'Serve dry kibble. Can add a spoonful of wet food or warm water on top for variety.',
    tips: ['Second C3 vaccination due', 'Second worming due', 'Check body condition — should feel ribs but not see them', 'If changing food brands, transition over 7 days (mix old + new)'] },
  { week: 12, meals: 3, texture: 'Regular puppy kibble', goal: 'Settled routine — growing fast!',
    foods: ['Puppy kibble (small breed formula)', 'Puppy wet food', 'Safe treats: blueberries, apple (no seeds), banana (small amounts)', 'Lean cooked meat'],
    amount: '~⅓ cup dry kibble per day split across 3 meals',
    recipe: 'Standard serving of puppy kibble following packet guidelines for weight. Adjust based on body condition.',
    tips: ['Can reduce to 2 meals/day from 6 months', 'Final worming in 2-weekly series due', 'Always have fresh water available', 'NEVER feed: chocolate, grapes, onion, garlic, xylitol, macadamias, cooked bones'] },
];

/* ── Foods to NEVER feed ───────────────────────────────────── */
export const dangerousFoods = [
  { food: 'Chocolate',           icon: '🍫', why: 'Contains theobromine — toxic to dogs, even small amounts' },
  { food: 'Grapes & Raisins',    icon: '🍇', why: 'Can cause kidney failure — even one grape' },
  { food: 'Onion & Garlic',      icon: '🧅', why: 'Damages red blood cells — all forms (raw, cooked, powder)' },
  { food: 'Xylitol (sweetener)', icon: '🍬', why: 'Found in sugar-free gum/lollies — causes liver failure' },
  { food: 'Cooked Bones',        icon: '🦴', why: 'Splinter and can perforate intestines — raw bones OK under supervision' },
  { food: 'Macadamia Nuts',      icon: '🥜', why: 'Causes vomiting, tremors, hyperthermia' },
  { food: 'Avocado',             icon: '🥑', why: 'Contains persin — can cause vomiting and diarrhoea' },
  { food: 'Cow\'s Milk',         icon: '🥛', why: 'Most puppies are lactose intolerant — causes diarrhoea' },
  { food: 'Caffeine',            icon: '☕', why: 'Stimulant — dangerous heart rate and restlessness' },
  { food: 'Alcohol',             icon: '🍺', why: 'Even tiny amounts are extremely toxic to small dogs' },
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

export const feeders = ['Jason', 'Wendy', 'Racheal'];

/* Default feed schedule times (24h format) — matches meals/day from guide */
export const defaultFeedSchedule = ['06:00', '10:00', '14:00', '18:00'];

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
