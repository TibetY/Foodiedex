import { describe, it, expect, vi, beforeEach } from 'vitest';

// A stand-in for the Supabase query builder: every chained call returns the
// builder, and awaiting `.single()` yields the next queued result.
const results: { data: unknown; error: unknown }[] = [];
const sent: Record<string, unknown>[] = [];
const builder = {
  insert: (row: Record<string, unknown>) => (sent.push(row), builder),
  update: (row: Record<string, unknown>) => (sent.push(row), builder),
  eq: () => builder,
  select: () => builder,
  single: async () => results.shift(),
};
vi.mock('~/supabase.client', () => ({
  getSupabaseBrowserClient: () => ({ from: () => builder }),
}));

import { createRestaurant, updateRestaurant } from './restaurants.client';

const savedRow = { id: 'r1', list_id: 'l1', added_by: 'u1', name: 'Alo', locations: [] };
const missingColumn = { code: 'PGRST204', message: "Could not find the 'distinctions' column of 'restaurants' in the schema cache" };

beforeEach(() => {
  results.length = 0;
  sent.length = 0;
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('saving when the distinctions column does not exist yet', () => {
  it('retries a create without distinctions', async () => {
    results.push({ data: null, error: missingColumn }, { data: savedRow, error: null });
    const saved = await createRestaurant({ name: 'Alo', distinctions: ['canadas-100-best'] }, 'l1', 'u1');
    expect(saved.name).toBe('Alo');
    expect(sent).toHaveLength(2);
    expect(sent[0]).toHaveProperty('distinctions', ['canadas-100-best']);
    expect(sent[1]).not.toHaveProperty('distinctions');
  });

  it('retries an update without distinctions', async () => {
    results.push({ data: null, error: missingColumn }, { data: savedRow, error: null });
    await updateRestaurant('r1', { name: 'Alo', distinctions: ['la-liste'] }, 'l1', 'u1');
    expect(sent).toHaveLength(2);
    expect(sent[1]).not.toHaveProperty('distinctions');
  });

  it('does not retry, and throws, on any other error', async () => {
    results.push({ data: null, error: { code: '42501', message: 'permission denied' } });
    await expect(createRestaurant({ name: 'Alo', distinctions: ['la-liste'] }, 'l1', 'u1')).rejects.toMatchObject({ code: '42501' });
    expect(sent).toHaveLength(1);
  });

  it('leaves the shared legacy rating alone on an ordinary edit', async () => {
    results.push({ data: savedRow, error: null }, { data: savedRow, error: null });
    await updateRestaurant('r1', { name: 'Alo' }, 'l1', 'u1');
    expect(sent[0]).not.toHaveProperty('rating');
    // ...but still writes it when a caller passes one (e.g. restoring a place)
    await updateRestaurant('r1', { name: 'Alo', rating: 4 }, 'l1', 'u1');
    expect(sent[1]).toHaveProperty('rating', 4);
  });

  it('sends one request when the column exists', async () => {
    results.push({ data: { ...savedRow, distinctions: ['la-liste'] }, error: null });
    const saved = await createRestaurant({ name: 'Alo', distinctions: ['la-liste'] }, 'l1', 'u1');
    expect(saved.distinctions).toEqual(['la-liste']);
    expect(sent).toHaveLength(1);
  });
});
