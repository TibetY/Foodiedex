import type { Restaurant } from '~/types/restaurant';

/**
 * The recognitions a place can carry, as one pick-list. To offer another guide
 * or list, add a line here — nothing else needs to change.
 *
 * Michelin stars and Bib Gourmand keep their own database columns
 * (michelin_stars, bib_gourmand): the stats page counts them and the website
 * scrape fills them. Every other entry is stored by id in `distinctions`.
 * Ids are stored, so never rename one; change the label instead.
 */
export interface Distinction {
  id: string;
  label: string;
  group: 'Michelin Guide' | 'Canada' | 'Europe' | 'International';
}

export const DISTINCTIONS: Distinction[] = [
  { id: 'michelin-1', label: '1 Michelin Star', group: 'Michelin Guide' },
  { id: 'michelin-2', label: '2 Michelin Stars', group: 'Michelin Guide' },
  { id: 'michelin-3', label: '3 Michelin Stars', group: 'Michelin Guide' },
  { id: 'bib-gourmand', label: 'Bib Gourmand', group: 'Michelin Guide' },
  { id: 'michelin-green-star', label: 'Michelin Green Star', group: 'Michelin Guide' },
  { id: 'canadas-100-best', label: "Canada's 100 Best", group: 'Canada' },
  { id: 'enroute-best-new', label: "enRoute Canada's Best New Restaurants", group: 'Canada' },
  { id: 'gault-millau', label: 'Gault&Millau', group: 'Europe' },
  { id: 'repsol-sol', label: 'Repsol Guide Sol', group: 'Europe' },
  { id: 'aa-rosette', label: 'AA Rosette', group: 'Europe' },
  { id: 'gambero-rosso', label: 'Gambero Rosso', group: 'Europe' },
  { id: 'worlds-50-best', label: "The World's 50 Best", group: 'International' },
  { id: 'north-americas-50-best', label: "North America's 50 Best", group: 'International' },
  { id: 'la-liste', label: 'La Liste', group: 'International' },
  { id: 'oad', label: 'OAD Top Restaurants', group: 'International' },
  { id: 'james-beard', label: 'James Beard Award', group: 'International' },
];

export const DISTINCTION_GROUPS: Distinction['group'][] = ['Michelin Guide', 'Canada', 'Europe', 'International'];

const STAR_IDS = ['michelin-1', 'michelin-2', 'michelin-3'];
const BIB_ID = 'bib-gourmand';
/** Stars and Bib Gourmand: a place holds at most one of these. */
const MICHELIN_TIER_IDS = [...STAR_IDS, BIB_ID];
const ORDER = new Map(DISTINCTIONS.map((d, i) => [d.id, i]));

type Recognised = Pick<Restaurant, 'michelinStars' | 'bibGourmand' | 'distinctions'>;

/** The ids a place holds, in pick-list order, read from all three fields. */
export function distinctionIds(r: Recognised): string[] {
  const ids: string[] = [];
  const stars = r.michelinStars ?? 0;
  if (stars >= 1 && stars <= 3) ids.push(`michelin-${stars}`);
  if (r.bibGourmand) ids.push(BIB_ID);
  // Only ids on the list: the column accepts any text through the API, and an
  // unknown one would otherwise show as a made-up badge.
  for (const id of r.distinctions ?? []) {
    if (ORDER.has(id) && !MICHELIN_TIER_IDS.includes(id) && !ids.includes(id)) ids.push(id);
  }
  return ids.sort((a, b) => (ORDER.get(a) ?? 999) - (ORDER.get(b) ?? 999));
}

/** Split a selection back into the fields the database stores. */
export function fieldsFromDistinctionIds(ids: string[]): Required<Recognised> {
  const star = STAR_IDS.findIndex((id) => ids.includes(id));
  return {
    michelinStars: star + 1,
    bibGourmand: ids.includes(BIB_ID),
    distinctions: ids.filter((id) => !MICHELIN_TIER_IDS.includes(id)),
  };
}

/**
 * Apply a change to the selection. Picking a Michelin star tier or Bib Gourmand
 * replaces whichever of those was already picked, since a place holds only one.
 */
export function applyDistinctionChange(prev: string[], next: string[]): string[] {
  const added = next.find((id) => !prev.includes(id));
  if (added && MICHELIN_TIER_IDS.includes(added)) {
    return next.filter((id) => id === added || !MICHELIN_TIER_IDS.includes(id));
  }
  return next;
}

/** The display name for one id, or the id itself if it is no longer listed. */
export function distinctionLabel(id: string): string {
  return DISTINCTIONS.find((d) => d.id === id)?.label ?? id;
}

/** What each non-tier distinction looks like when a website names it. */
const AWARD_PATTERNS: [id: string, pattern: RegExp][] = [
  // Gaps are bounded so a long run of one keyword can't make matching slow.
  ['michelin-green-star', /michelin[^;]{0,60}green star|green star[^;]{0,60}michelin/],
  ['canadas-100-best', /canada['’]?s 100 best/],
  ['enroute-best-new', /en\s?route[^;]{0,60}best new restaurant/],
  ['gault-millau', /gault\s{0,3}(?:&|et|and|und)?\s{0,3}millau/],
  ['repsol-sol', /\brepsol\b/],
  ['aa-rosette', /\baa rosettes?\b/],
  ['gambero-rosso', /gambero rosso/],
  ['north-americas-50-best', /north america['’]?s 50 best/],
  ['worlds-50-best', /world['’]?s 50 best/],
  ['la-liste', /\bla liste\b/],
  ['oad', /opinionated about dining|\boad\b/],
  ['james-beard', /james beard/],
];

/**
 * The non-Michelin-tier distinctions named in a piece of award text (a site's
 * own structured "award" data). Only explicit names match — nothing is inferred.
 */
export function detectDistinctions(text: string): string[] {
  const lower = text.slice(0, 2000).toLowerCase();
  return AWARD_PATTERNS.filter(([, pattern]) => pattern.test(lower)).map(([id]) => id);
}

/** Display names for what a place holds. An id no longer in the list is skipped. */
export function distinctionLabels(r: Recognised): string[] {
  return distinctionIds(r)
    .map((id) => DISTINCTIONS.find((d) => d.id === id)?.label)
    .filter((label): label is string => !!label);
}
