DELETE FROM user_application_roles
WHERE application_role_id IN (
  SELECT id FROM application_roles
  WHERE key IN (
    'service_permit',
    'service_education',
    'service_social',
    'service_health'
  )
);

DELETE FROM application_roles
WHERE key IN (
  'service_permit',
  'service_education',
  'service_social',
  'service_health'
);