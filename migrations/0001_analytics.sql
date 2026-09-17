CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  event_date TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '',
  traffic_source TEXT NOT NULL DEFAULT 'Direct',
  device_type TEXT NOT NULL DEFAULT 'Other',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_content TEXT NOT NULL DEFAULT '',
  resource_slug TEXT NOT NULL DEFAULT '',
  placement TEXT NOT NULL DEFAULT '',
  scroll_depth INTEGER,
  session_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS analytics_events_date ON analytics_events(event_date);
CREATE INDEX IF NOT EXISTS analytics_events_name_date ON analytics_events(event_name, event_date);
CREATE INDEX IF NOT EXISTS analytics_events_session_date ON analytics_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_resource_date ON analytics_events(resource_slug, event_date);
