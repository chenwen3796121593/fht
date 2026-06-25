-- 在 Supabase SQL Editor 里跑
-- https://fxpxlobftrdlswyhrnhv.supabase.co → SQL Editor

CREATE TABLE IF NOT EXISTS vip_applications (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vip_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 给 publishable key 开权限
ALTER TABLE vip_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_users ENABLE ROW LEVEL SECURITY;

-- 允许任何人提交申请
CREATE POLICY "allow_insert_applications" ON vip_applications FOR INSERT WITH CHECK (true);

-- 管理员可读写 applications（用 service_role 或后续加）
CREATE POLICY "allow_select_applications" ON vip_applications FOR SELECT USING (true);
CREATE POLICY "allow_update_applications" ON vip_applications FOR UPDATE USING (true);

-- 允许读取 vip_users（登录用）
CREATE POLICY "allow_select_users" ON vip_users FOR SELECT USING (true);
CREATE POLICY "allow_insert_users" ON vip_users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_users" ON vip_users FOR UPDATE USING (true);
