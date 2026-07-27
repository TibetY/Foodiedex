import type {
  InviteLink,
  ListMember,
  Profile,
  RestaurantList,
  RestaurantRating,
  ShareLink,
} from '~/types/restaurant';

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export interface ListMemberRow {
  id: string;
  list_id: string;
  user_id: string;
  role: RestaurantList['role'];
  profiles?: ProfileRow | null;
}

export function rowToListMember(row: ListMemberRow): ListMember {
  return {
    id: row.id,
    listId: row.list_id,
    userId: row.user_id,
    role: row.role,
    profile: row.profiles ? rowToProfile(row.profiles) : undefined,
  };
}

export interface InviteLinkRow {
  id: string;
  token: string;
  list_id: string;
  role: InviteLink['role'];
  active: boolean;
}

export function rowToInviteLink(row: InviteLinkRow): InviteLink {
  return {
    id: row.id,
    token: row.token,
    listId: row.list_id,
    role: row.role,
    active: row.active,
  };
}

export interface ShareLinkRow {
  id: string;
  token: string;
  list_id: string;
  expires_at: string | null;
  active: boolean;
}

export function rowToShareLink(row: ShareLinkRow): ShareLink {
  return {
    id: row.id,
    token: row.token,
    listId: row.list_id,
    expiresAt: row.expires_at ?? undefined,
    active: row.active,
  };
}

export interface RestaurantRatingRow {
  id: string;
  restaurant_id: string;
  user_id: string;
  /** numeric(2,1) — half steps; may arrive as a string, so coerce on read. */
  rating: number | string;
  note: string | null;
  updated_at?: string | null;
  profiles?: ProfileRow | null;
}

export function rowToRestaurantRating(row: RestaurantRatingRow): RestaurantRating {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    userId: row.user_id,
    rating: Number(row.rating),
    note: row.note ?? undefined,
    profile: row.profiles ? rowToProfile(row.profiles) : undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}
