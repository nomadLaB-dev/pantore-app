-- ==========================================
-- 1. 資格区分 (qualification) を Enum で定義
-- ==========================================

CREATE TYPE qualification AS ENUM ('ipd', 'inter', 'fedex', 'q_dome','mediford');

-- ==========================================
-- 2. 資格ステータス (qualification_status) を Enum で定義
-- ==========================================

CREATE TYPE qualification_status AS ENUM ('none','training','qualified');