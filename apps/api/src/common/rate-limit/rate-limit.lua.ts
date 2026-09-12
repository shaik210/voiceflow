/**
 * Redis Lua script implementing an atomic sliding-window counter.
 *
 * KEYS[1]: Base rate limit key (e.g. "rl:usr:user123:transcribe")
 * ARGV[1]: Limit (maximum number of requests allowed in window)
 * ARGV[2]: Window size in seconds
 *
 * Algorithm:
 * 1. Obtains the current server timestamp from Redis via TIME (avoiding Node.js clock drift).
 * 2. Determines current window index and previous window index.
 * 3. Calculates the weight of the previous window based on elapsed time into the current window.
 * 4. Combines current count + weighted previous count to estimate request volume.
 * 5. If limit exceeded, returns rejected result without incrementing.
 * 6. If allowed, atomically increments current window counter, sets TTL (2 * window), and returns success.
 *
 * Return array format:
 * [ allowed (1 or 0), limit, remaining, resetSeconds ]
 */
export const RATE_LIMIT_SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local time = redis.call('TIME')
local now = tonumber(time[1])

local current_window = math.floor(now / window)
local prev_window = current_window - 1
local elapsed = now % window
local weight = (window - elapsed) / window

local current_key = key .. ":" .. current_window
local prev_key = key .. ":" .. prev_window

local current_count = tonumber(redis.call('GET', current_key) or "0")
local prev_count = tonumber(redis.call('GET', prev_key) or "0")

local current_estimate = math.floor(prev_count * weight) + current_count

if current_estimate >= limit then
  local reset_seconds = window - elapsed
  if reset_seconds < 1 then reset_seconds = 1 end
  return { 0, limit, 0, reset_seconds }
end

local new_count = redis.call('INCRBY', current_key, 1)
redis.call('EXPIRE', current_key, window * 2)

local total_estimate = math.floor(prev_count * weight) + new_count
local remaining = limit - total_estimate
if remaining < 0 then remaining = 0 end
local reset_seconds = window - elapsed
if reset_seconds < 1 then reset_seconds = 1 end

return { 1, limit, remaining, reset_seconds }
`;
