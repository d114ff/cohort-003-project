import { eq, and, or, sql } from "drizzle-orm";
import { db } from "~/db";
import { ratings } from "~/db/schema";

// ─── Rating Service ───
// Handles star ratings (1-5) for courses. One rating per user per course.
// Uses positional parameters (project convention).

export function getRatingById(id: number) {
  return db.select().from(ratings).where(eq(ratings.id, id)).get();
}

export function findRating(userId: number, courseId: number) {
  return db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.courseId, courseId)))
    .get();
}

export function getUserRating(userId: number, courseId: number) {
  return findRating(userId, courseId);
}

export function getCourseAverageRating(courseId: number) {
  const result = db
    .select({
      average: sql<number>`round(avg(${ratings.rating}), 1)`,
      count: sql<number>`count(*)`,
    })
    .from(ratings)
    .where(eq(ratings.courseId, courseId))
    .get();

  return {
    average: result?.average ?? null,
    count: result?.count ?? 0,
  };
}

/**
 * Get average ratings for multiple courses at once.
 * Returns a map of courseId → { average, count }.
 */
export function getMultipleCourseRatings(courseIds: number[]) {
  if (courseIds.length === 0) return new Map();

  const results = db
    .select({
      courseId: ratings.courseId,
      average: sql<number>`round(avg(${ratings.rating}), 1)`,
      count: sql<number>`count(*)`,
    })
    .from(ratings)
    .where(or(...courseIds.map((id) => eq(ratings.courseId, id)))!)
    .groupBy(ratings.courseId)
    .all();

  const ratingMap = new Map<number, { average: number | null; count: number }>();
  for (const id of courseIds) {
    ratingMap.set(id, { average: null, count: 0 });
  }
  for (const row of results) {
    ratingMap.set(row.courseId, { average: row.average ?? null, count: row.count });
  }

  return ratingMap;
}

/**
 * Create or update a rating (upsert). One rating per user per course.
 * Returns the rating record.
 */
export function upsertRating(
  userId: number,
  courseId: number,
  rating: number
) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));

  const existing = findRating(userId, courseId);
  if (existing) {
    return db
      .update(ratings)
      .set({ rating: clamped, updatedAt: new Date().toISOString() })
      .where(eq(ratings.id, existing.id))
      .returning()
      .get()!;
  }

  return db
    .insert(ratings)
    .values({ userId, courseId, rating: clamped })
    .returning()
    .get()!;
}

/**
 * Get total count of ratings for a course.
 */
export function getRatingCountForCourse(courseId: number) {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(ratings)
    .where(eq(ratings.courseId, courseId))
    .get();

  return result?.count ?? 0;
}

/**
 * Delete a rating.
 */
export function deleteRating(userId: number, courseId: number) {
  const existing = findRating(userId, courseId);
  if (!existing) return null;

  return db
    .delete(ratings)
    .where(eq(ratings.id, existing.id))
    .returning()
    .get();
}
