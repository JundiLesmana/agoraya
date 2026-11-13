INSERT INTO application_roles (key, name)
VALUES
  ('service_permit', 'Petugas Layanan Perizinan'),
  ('service_education', 'Petugas Layanan Pendidikan'),
  ('service_social', 'Petugas Layanan Sosial'),
  ('service_health', 'Petugas Layanan Kesehatan')
ON CONFLICT (key) DO UPDATE
SET name = EXCLUDED.name;