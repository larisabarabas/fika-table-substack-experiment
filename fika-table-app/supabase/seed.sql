-- Seed 12 slices in round 0 to test increment_round()
-- Run this in the Supabase SQL editor after resetting round to 0:
--   UPDATE cake_config SET round = 0 WHERE id = 1;

INSERT INTO slices (round, idx, from_name, to_name, to_type, message, color) VALUES
  (0, 0,  'Alex',     'the host',       'host',   'Thanks for building this lovely table!',              0),
  (0, 1,  'Jordan',   'a fellow reader', 'reader', 'Your comments always make my day.',                    1),
  (0, 2,  'Morgan',   'a writer',       'writer', 'That last post really stuck with me.',                  2),
  (0, 3,  'Casey',    'a friend',       'friend', 'Glad we found the same Substack.',                      3),
  (0, 4,  'Riley',    'the table',      'anyone', 'Pouring one out for all the lurkers.',                   4),
  (0, 5,  'Sam',      'the host',       'host',   'The cake is a genius idea!',                            5),
  (0, 6,  'Taylor',   'a writer',       'writer', 'Your newsletter is my Monday highlight.',               6),
  (0, 7,  'Quinn',    'a friend',       'friend', 'Thanks for the recommendation — best read this year.',  7),
  (0, 8,  'Avery',    'the table',      'anyone', 'To the person who needs to hear this: keep going.',     0),
  (0, 9,  'Blake',    'a fellow reader', 'reader', 'Your comment thread was better than the article!',      1),
  (0, 10, 'Drew',     'a writer',       'writer', 'I look forward to every single issue.',                 2),
  (0, 11, 'Skyler',   'the host',       'host',   'This space feels like a warm hug.',                     3);
