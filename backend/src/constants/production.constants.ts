// How many weeks past the current display week admins can navigate forward.
// Single source of truth: the frontend derives the window from the weekStarts
// list returned by GET /api/production, never from its own constant.
export const MAX_WEEK_OFFSET = 2;
