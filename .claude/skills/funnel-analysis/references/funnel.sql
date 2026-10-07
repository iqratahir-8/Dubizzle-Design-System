-- Closed funnel per user from the GA4 BigQuery export (one dataset per GA4 property / tenant).
-- Replace PROJECT.DATASET (tenants.json → ga4.bigquery_dataset), the dates and the step names.
-- Steps must happen in order, each after the previous one, all within the window of step 1.
-- Untested against a dubizzle dataset: run it on a 1–2 day range first.

DECLARE start_date STRING DEFAULT '20260901';
DECLARE end_date   STRING DEFAULT '20260930';
DECLARE window_us  INT64  DEFAULT 7 * 24 * 60 * 60 * 1000000;  -- 7 days

WITH ev AS (
  SELECT
    user_pseudo_id, event_name, event_timestamp, platform,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'ui_language') AS ui_language,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'surface')     AS surface
  FROM `PROJECT.DATASET.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
    AND event_name IN ('view_item_list', 'select_item', 'view_item', 'generate_lead')
),
s1 AS (
  SELECT user_pseudo_id, ANY_VALUE(platform) AS platform, ANY_VALUE(surface) AS surface,
         ANY_VALUE(ui_language) AS ui_language, MIN(event_timestamp) AS t
  FROM ev WHERE event_name = 'view_item_list' GROUP BY user_pseudo_id
),
s2 AS (
  SELECT s1.user_pseudo_id, MIN(e.event_timestamp) AS t
  FROM s1 JOIN ev e ON e.user_pseudo_id = s1.user_pseudo_id AND e.event_name = 'select_item'
   AND e.event_timestamp > s1.t AND e.event_timestamp <= s1.t + window_us
  GROUP BY s1.user_pseudo_id
),
s3 AS (
  SELECT s2.user_pseudo_id, MIN(e.event_timestamp) AS t
  FROM s2 JOIN s1 ON s1.user_pseudo_id = s2.user_pseudo_id
  JOIN ev e ON e.user_pseudo_id = s2.user_pseudo_id AND e.event_name = 'view_item'
   AND e.event_timestamp > s2.t AND e.event_timestamp <= s1.t + window_us
  GROUP BY s2.user_pseudo_id
),
s4 AS (
  SELECT s3.user_pseudo_id, MIN(e.event_timestamp) AS t
  FROM s3 JOIN s1 ON s1.user_pseudo_id = s3.user_pseudo_id
  JOIN ev e ON e.user_pseudo_id = s3.user_pseudo_id AND e.event_name = 'generate_lead'
   AND e.event_timestamp > s3.t AND e.event_timestamp <= s1.t + window_us
  GROUP BY s3.user_pseudo_id
)
SELECT
  s1.platform, s1.surface, s1.ui_language,
  COUNT(s1.user_pseudo_id) AS step1_view_item_list,
  COUNT(s2.user_pseudo_id) AS step2_select_item,
  COUNT(s3.user_pseudo_id) AS step3_view_item,
  COUNT(s4.user_pseudo_id) AS step4_generate_lead,
  SAFE_DIVIDE(COUNT(s4.user_pseudo_id), COUNT(s1.user_pseudo_id)) AS overall_conversion
FROM s1
LEFT JOIN s2 ON s2.user_pseudo_id = s1.user_pseudo_id
LEFT JOIN s3 ON s3.user_pseudo_id = s1.user_pseudo_id
LEFT JOIN s4 ON s4.user_pseudo_id = s1.user_pseudo_id
GROUP BY 1, 2, 3
ORDER BY step1_view_item_list DESC;

-- Cost: the export is sharded by day (events_YYYYMMDD). Keep the range tight; ask the data team for
-- a maximum-bytes-billed limit on the project the connector uses.
