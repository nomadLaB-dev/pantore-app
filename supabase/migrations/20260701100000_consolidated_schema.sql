-- =====================================================================
-- SpecimenChimera 統合スキーマ
-- 旧マイグレーション74ファイルをこの1ファイルに集約
-- 生成日: 2026-07-01
-- =====================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."employment_category" AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'dispatch'
);


ALTER TYPE "public"."employment_category" OWNER TO "postgres";


CREATE TYPE "public"."inspection_type" AS ENUM (
    'vehicle_inspection',
    'annual_inspection',
    'oil_change',
    'tire_change_seasonal',
    'tire_replacement',
    'battery_replacement',
    'wiper_replacement',
    'brake_pad_replacement',
    'repair',
    'other'
);


ALTER TYPE "public"."inspection_type" OWNER TO "postgres";


CREATE TYPE "public"."office_registration_status" AS ENUM (
    'not_applied',
    'not_required',
    'applied'
);


ALTER TYPE "public"."office_registration_status" OWNER TO "postgres";


CREATE TYPE "public"."qualification" AS ENUM (
    'ipd',
    'inter',
    'fedex',
    'q_dome',
    'mediford'
);


ALTER TYPE "public"."qualification" OWNER TO "postgres";


CREATE TYPE "public"."qualification_status" AS ENUM (
    'none',
    'training',
    'qualified'
);


ALTER TYPE "public"."qualification_status" OWNER TO "postgres";


CREATE TYPE "public"."real_estate_ownership_type" AS ENUM (
    'owned',
    'leased'
);


ALTER TYPE "public"."real_estate_ownership_type" OWNER TO "postgres";


CREATE TYPE "public"."tire_type" AS ENUM (
    'normal',
    'studless'
);


ALTER TYPE "public"."tire_type" OWNER TO "postgres";


CREATE TYPE "public"."usage_type" AS ENUM (
    'office',
    'commercial_office',
    'warehouse',
    'parking_lot',
    'other'
);


ALTER TYPE "public"."usage_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_auth_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT tenant_id FROM users WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_auth_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "employee_id" "text",
    "event_type" "text" NOT NULL,
    "time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_logs_event_type_check" CHECK (("event_type" = ANY (ARRAY['clock_in'::"text", 'break_start'::"text", 'break_end'::"text", 'clock_out'::"text"])))
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "time" timestamp with time zone,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "attendance_records_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'working'::"text", 'on_break'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."attendance_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."branches" (
    "id" "text" NOT NULL,
    "tenant_id" "uuid",
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pref_id" "text",
    "tel" "text" DEFAULT ''::"text" NOT NULL,
    "invoice" "text",
    "delivery_areas" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "branches_delivery_areas_max5" CHECK ((("array_length"("delivery_areas", 1) IS NULL) OR ("array_length"("delivery_areas", 1) <= 5)))
);


ALTER TABLE "public"."branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_entry_drafts" (
    "id" "text" DEFAULT 'global'::"text" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "state_json" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."data_entry_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_qualifications" (
    "employee_id" "text",
    "qualification" "public"."qualification" NOT NULL,
    "qualification_status" "public"."qualification_status" NOT NULL,
    "acquired_date" "date",
    "last_work_date" "date",
    "is_active" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "training_date" "date",
    "ojt_1st_date" "date",
    "ojt_2nd_date" "date",
    "ojt_3rd_date" "date",
    "assessment_date" "date",
    "update_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_qualifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."office_registration_status_values" AS
 SELECT ("pg_enum"."enumlabel")::"text" AS "value"
   FROM ("pg_enum"
     JOIN "pg_type" ON (("pg_enum"."enumtypid" = "pg_type"."oid")))
  WHERE ("pg_type"."typname" = 'office_registration_status'::"name");


ALTER VIEW "public"."office_registration_status_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prefectures" (
    "id" "text" NOT NULL,
    "area_id" "text",
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prefectures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_estate_contracts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "real_estate_id" "uuid" NOT NULL,
    "landlord" "text" NOT NULL,
    "monthly_rent" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "alert_days_before" integer DEFAULT 90,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."real_estate_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_estate_usages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "real_estate_id" "uuid" NOT NULL,
    "usage_type" "public"."usage_type" NOT NULL,
    "floor_area" numeric,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."real_estate_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_estates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "ownership_type" "public"."real_estate_ownership_type" DEFAULT 'leased'::"public"."real_estate_ownership_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "branches_id" "text",
    "office_registration_status" "public"."office_registration_status" DEFAULT 'not_applied'::"public"."office_registration_status" NOT NULL
);


ALTER TABLE "public"."real_estates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_estates_garages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "real_estate_id" "uuid" NOT NULL,
    "is_attached_to_office" boolean DEFAULT true NOT NULL,
    "address" "text",
    "monthly_rent" integer,
    "start_date" "date",
    "end_date" "date",
    "capacity" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "landlord" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."real_estates_garages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."real_estates_rest_facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "real_estate_id" "uuid" NOT NULL,
    "is_attached_to_office" boolean DEFAULT true NOT NULL,
    "address" "text",
    "monthly_rent" integer,
    "start_date" "date",
    "end_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "landlord" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."real_estates_rest_facilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "uid" "text",
    "facility_name" "text",
    "collect_date" "date",
    "collect_time" "text",
    "system_type" "text",
    "area" "text",
    "delivery_type" "text",
    "base" "text",
    "facility_code" "text",
    "visit_place" "text",
    "trial_name" "text",
    "request_date" "date",
    "request_time" "text",
    "service" "text",
    "con_no" "text",
    "box_count" integer,
    "request" "text",
    "courier_code" "text",
    "courier_name" "text",
    "reference" "text",
    "rev" "text",
    "note" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "attachment_path" "text",
    "attachment_name" "text",
    "pickup_done" boolean DEFAULT false NOT NULL,
    "vehicle_loaded" boolean DEFAULT false NOT NULL,
    "unloaded" boolean DEFAULT false NOT NULL,
    "delivered" boolean DEFAULT false NOT NULL,
    "branch_available" boolean
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings_couriers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "area" "text",
    "name" "text" NOT NULL,
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."settings_couriers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings_delivery_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."settings_delivery_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings_facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "facility" "text" NOT NULL,
    "area" "text",
    "location_name" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."settings_facilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "billing_name" "text",
    "billing_email" "text",
    "billing_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "pref_id" "text",
    "billing_tel" "text" DEFAULT ''::"text" NOT NULL,
    "invoice" "text",
    "parent_id" "uuid"
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."usage_type_values" AS
 SELECT ("pg_enum"."enumlabel")::"text" AS "value"
   FROM ("pg_enum"
     JOIN "pg_type" ON (("pg_enum"."enumtypid" = "pg_type"."oid")))
  WHERE ("pg_type"."typname" = 'usage_type'::"name");


ALTER VIEW "public"."usage_type_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "employee_id" "text" NOT NULL,
    "schedule_visible_columns" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "last_name" "text",
    "first_name" "text",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "hire_date" "date" NOT NULL,
    "leave_date" "date",
    "account_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "branch_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_name_kana" "text" DEFAULT ''::"text" NOT NULL,
    "employment_category" "public"."employment_category" DEFAULT 'full_time'::"public"."employment_category" NOT NULL,
    "hourly_rate" integer,
    "birthday" "date",
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "tel" "text" DEFAULT ''::"text" NOT NULL,
    "line_id" "text",
    "emergency_contact" "text" DEFAULT ''::"text" NOT NULL,
    "invoice" "text",
    "certification_num" "text",
    "contracted_hours_per_week_min" numeric DEFAULT 0 NOT NULL,
    "contracted_hours_per_week_max" numeric DEFAULT 0 NOT NULL,
    "proficiency_rate" numeric,
    "specimen_role" "text",
    "user_code" "text",
    "qr_token" "text",
    CONSTRAINT "employees_specimen_role_check" CHECK (("specimen_role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'base'::"text", 'driver'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_accidents" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "vehicle_id" "text" NOT NULL,
    "accident_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "severity" "text" DEFAULT 'low'::"text" NOT NULL,
    "repair_cost" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_bodily_injury" boolean DEFAULT false NOT NULL,
    "is_property_damage" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."vehicle_accidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_inspection" (
    "id" "text" NOT NULL,
    "vehicle_id" "text" NOT NULL,
    "accidents_id" "text",
    "inspection_type" "public"."inspection_type" NOT NULL,
    "inspection_start_date" "date" NOT NULL,
    "inspection_end_date" "date" NOT NULL,
    "inspection_cost" integer NOT NULL,
    "next_inspection_mileage" integer,
    "next_inspection_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_inspection" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_insurances" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "vehicle_id" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "premium_amount" integer,
    "coverage_details" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_insurances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_leases" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "vehicle_id" "text",
    "lease_company" "text" NOT NULL,
    "contract_start_date" "date" NOT NULL,
    "contract_end_date" "date" NOT NULL,
    "monthly_fee" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_leases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_mileage" (
    "id" "text" NOT NULL,
    "vehicle_id" "text",
    "record_date" "date" NOT NULL,
    "mileage" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_mileage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_purchases" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "vehicle_id" "text",
    "acquisition_cost" integer NOT NULL,
    "purchase_date" "date" NOT NULL,
    "first_registration_date" "date",
    "body_type" "text" DEFAULT 'passenger_standard'::"text" NOT NULL,
    "is_new_car" boolean DEFAULT true NOT NULL,
    "method" "text" DEFAULT 'straight'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "text",
    "manufacturer" "text" NOT NULL,
    "model" "text" NOT NULL,
    "license_plate" "text",
    "license_plate_color" "text",
    "ownership_type" "text" DEFAULT 'owned'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tire_type" "public"."tire_type" DEFAULT 'normal'::"public"."tire_type" NOT NULL,
    "is_transport_bureau_applied" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_tenant_id_employee_id_key" UNIQUE ("tenant_id", "employee_id");



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_entry_drafts"
    ADD CONSTRAINT "data_entry_drafts_pkey" PRIMARY KEY ("tenant_id", "id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "employees_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prefectures"
    ADD CONSTRAINT "prefectures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_estate_contracts"
    ADD CONSTRAINT "real_estate_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_estate_contracts"
    ADD CONSTRAINT "real_estate_contracts_real_estate_id_key" UNIQUE ("real_estate_id");



ALTER TABLE ONLY "public"."real_estate_usages"
    ADD CONSTRAINT "real_estate_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_estates_garages"
    ADD CONSTRAINT "real_estates_garages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_estates"
    ADD CONSTRAINT "real_estates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."real_estates_rest_facilities"
    ADD CONSTRAINT "real_estates_rest_facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings_couriers"
    ADD CONSTRAINT "settings_couriers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings_delivery_areas"
    ADD CONSTRAINT "settings_delivery_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings_facilities"
    ADD CONSTRAINT "settings_facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("employee_id");



ALTER TABLE ONLY "public"."vehicle_accidents"
    ADD CONSTRAINT "vehicle_accidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_inspection"
    ADD CONSTRAINT "vehicle_inspection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_insurances"
    ADD CONSTRAINT "vehicle_insurances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_vehicle_id_key" UNIQUE ("vehicle_id");



ALTER TABLE ONLY "public"."vehicle_mileage"
    ADD CONSTRAINT "vehicle_mileage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_purchases"
    ADD CONSTRAINT "vehicle_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_purchases"
    ADD CONSTRAINT "vehicle_purchases_vehicle_id_key" UNIQUE ("vehicle_id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE INDEX "attendance_logs_employee_time" ON "public"."attendance_logs" USING "btree" ("employee_id", "time" DESC);



CREATE UNIQUE INDEX "employees_user_code_tenant_unique" ON "public"."users" USING "btree" ("tenant_id", "user_code") WHERE ("user_code" IS NOT NULL);



CREATE OR REPLACE TRIGGER "handle_update_at" BEFORE UPDATE ON "public"."employee_qualifications" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('update_at');



CREATE OR REPLACE TRIGGER "update_real_estates_garages_updated_at" BEFORE UPDATE ON "public"."real_estates_garages" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_real_estates_rest_facilities_updated_at" BEFORE UPDATE ON "public"."real_estates_rest_facilities" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_vehicle_inspection_updated_at" BEFORE UPDATE ON "public"."vehicle_inspection" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicle_mileage_updated_at" BEFORE UPDATE ON "public"."vehicle_mileage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_records"
    ADD CONSTRAINT "attendance_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_pref_id_fkey" FOREIGN KEY ("pref_id") REFERENCES "public"."prefectures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."branches"
    ADD CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_entry_drafts"
    ADD CONSTRAINT "data_entry_drafts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_qualifications"
    ADD CONSTRAINT "employee_qualifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prefectures"
    ADD CONSTRAINT "prefectures_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."real_estate_contracts"
    ADD CONSTRAINT "real_estate_contracts_real_estate_id_fkey" FOREIGN KEY ("real_estate_id") REFERENCES "public"."real_estates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_estate_usages"
    ADD CONSTRAINT "real_estate_usages_real_estate_id_fkey" FOREIGN KEY ("real_estate_id") REFERENCES "public"."real_estates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_estates"
    ADD CONSTRAINT "real_estates_branches_id_fkey" FOREIGN KEY ("branches_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_estates_garages"
    ADD CONSTRAINT "real_estates_garages_real_estate_id_fkey" FOREIGN KEY ("real_estate_id") REFERENCES "public"."real_estates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_estates_rest_facilities"
    ADD CONSTRAINT "real_estates_rest_facilities_real_estate_id_fkey" FOREIGN KEY ("real_estate_id") REFERENCES "public"."real_estates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."real_estates"
    ADD CONSTRAINT "real_estates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings_couriers"
    ADD CONSTRAINT "settings_couriers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings_delivery_areas"
    ADD CONSTRAINT "settings_delivery_areas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings_facilities"
    ADD CONSTRAINT "settings_facilities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pref_id_fkey" FOREIGN KEY ("pref_id") REFERENCES "public"."prefectures"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_accidents"
    ADD CONSTRAINT "vehicle_accidents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_inspection"
    ADD CONSTRAINT "vehicle_inspection_accidents_id_fkey" FOREIGN KEY ("accidents_id") REFERENCES "public"."vehicle_accidents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_inspection"
    ADD CONSTRAINT "vehicle_inspection_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_insurances"
    ADD CONSTRAINT "vehicle_insurances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_mileage"
    ADD CONSTRAINT "vehicle_mileage_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_purchases"
    ADD CONSTRAINT "vehicle_purchases_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all access temporarily" ON "public"."areas" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access temporarily" ON "public"."employee_qualifications" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access temporarily" ON "public"."prefectures" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access temporarily" ON "public"."vehicle_inspection" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access temporarily" ON "public"."vehicle_mileage" USING (true) WITH CHECK (true);



CREATE POLICY "Users can delete real_estate_contracts of their tenant" ON "public"."real_estate_contracts" FOR DELETE USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can delete real_estate_usages of their tenant" ON "public"."real_estate_usages" FOR DELETE USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can delete real_estates of their tenant" ON "public"."real_estates" FOR DELETE USING (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "Users can insert real_estate_contracts of their tenant" ON "public"."real_estate_contracts" FOR INSERT WITH CHECK (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can insert real_estate_usages of their tenant" ON "public"."real_estate_usages" FOR INSERT WITH CHECK (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can insert real_estates of their tenant" ON "public"."real_estates" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "Users can update real_estate_contracts of their tenant" ON "public"."real_estate_contracts" FOR UPDATE USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can update real_estate_usages of their tenant" ON "public"."real_estate_usages" FOR UPDATE USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can update real_estates of their tenant" ON "public"."real_estates" FOR UPDATE USING (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "Users can view real_estate_contracts of their tenant" ON "public"."real_estate_contracts" FOR SELECT USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can view real_estate_usages of their tenant" ON "public"."real_estate_usages" FOR SELECT USING (("real_estate_id" IN ( SELECT "real_estates"."id"
   FROM "public"."real_estates"
  WHERE ("real_estates"."tenant_id" = "public"."get_auth_tenant_id"()))));



CREATE POLICY "Users can view real_estates of their tenant" ON "public"."real_estates" FOR SELECT USING (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendance_records_tenant_isolation" ON "public"."attendance_records" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_entry_drafts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "data_entry_drafts_tenant_isolation" ON "public"."data_entry_drafts" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."employee_qualifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prefectures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_estate_contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_estate_usages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_estates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_estates_garages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."real_estates_rest_facilities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schedules_tenant_isolation" ON "public"."schedules" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."settings_couriers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings_couriers_tenant_isolation" ON "public"."settings_couriers" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."settings_delivery_areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings_delivery_areas_tenant_isolation" ON "public"."settings_delivery_areas" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."settings_facilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "settings_facilities_tenant_isolation" ON "public"."settings_facilities" USING (("tenant_id" = "public"."get_auth_tenant_id"())) WITH CHECK (("tenant_id" = "public"."get_auth_tenant_id"()));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_own" ON "public"."user_preferences" USING (("employee_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."user_id" = "auth"."uid"())))) WITH CHECK (("employee_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_accidents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_inspection" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_insurances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_leases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_mileage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "自テナントのみ" ON "public"."attendance_logs" USING (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "自分の会社だけ見れる" ON "public"."tenants" USING (("id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "自分の会社のリースデータだけ見れる" ON "public"."vehicle_leases" USING ((EXISTS ( SELECT 1
   FROM "public"."vehicles"
  WHERE (("vehicles"."id" = "vehicle_leases"."vehicle_id") AND ("vehicles"."tenant_id" = "public"."get_auth_tenant_id"())))));



CREATE POLICY "自分の会社の事故データだけ見れる" ON "public"."vehicle_accidents" USING ((EXISTS ( SELECT 1
   FROM "public"."vehicles"
  WHERE (("vehicles"."id" = "vehicle_accidents"."vehicle_id") AND ("vehicles"."tenant_id" = "public"."get_auth_tenant_id"())))));



CREATE POLICY "自分の会社の保険データだけ見れる" ON "public"."vehicle_insurances" USING ((EXISTS ( SELECT 1
   FROM "public"."vehicles"
  WHERE (("vehicles"."id" = "vehicle_insurances"."vehicle_id") AND ("vehicles"."tenant_id" = "public"."get_auth_tenant_id"())))));



CREATE POLICY "自分の会社の支社だけ見れる" ON "public"."branches" USING (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "自分の会社の社員データだけ見れる" ON "public"."users" USING (("tenant_id" = "public"."get_auth_tenant_id"()));



CREATE POLICY "自分の会社の購入データだけ見れる" ON "public"."vehicle_purchases" USING ((EXISTS ( SELECT 1
   FROM "public"."vehicles"
  WHERE (("vehicles"."id" = "vehicle_purchases"."vehicle_id") AND ("vehicles"."tenant_id" = "public"."get_auth_tenant_id"())))));



CREATE POLICY "自分の会社の車両データだけ見れる" ON "public"."vehicles" USING (("tenant_id" = "public"."get_auth_tenant_id"()));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_auth_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_auth_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_auth_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."areas" TO "anon";
GRANT ALL ON TABLE "public"."areas" TO "authenticated";
GRANT ALL ON TABLE "public"."areas" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_records" TO "anon";
GRANT ALL ON TABLE "public"."attendance_records" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_records" TO "service_role";



GRANT ALL ON TABLE "public"."branches" TO "anon";
GRANT ALL ON TABLE "public"."branches" TO "authenticated";
GRANT ALL ON TABLE "public"."branches" TO "service_role";



GRANT ALL ON TABLE "public"."data_entry_drafts" TO "anon";
GRANT ALL ON TABLE "public"."data_entry_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."data_entry_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."employee_qualifications" TO "anon";
GRANT ALL ON TABLE "public"."employee_qualifications" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_qualifications" TO "service_role";



GRANT ALL ON TABLE "public"."office_registration_status_values" TO "anon";
GRANT ALL ON TABLE "public"."office_registration_status_values" TO "authenticated";
GRANT ALL ON TABLE "public"."office_registration_status_values" TO "service_role";



GRANT ALL ON TABLE "public"."prefectures" TO "anon";
GRANT ALL ON TABLE "public"."prefectures" TO "authenticated";
GRANT ALL ON TABLE "public"."prefectures" TO "service_role";



GRANT ALL ON TABLE "public"."real_estate_contracts" TO "anon";
GRANT ALL ON TABLE "public"."real_estate_contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."real_estate_contracts" TO "service_role";



GRANT ALL ON TABLE "public"."real_estate_usages" TO "anon";
GRANT ALL ON TABLE "public"."real_estate_usages" TO "authenticated";
GRANT ALL ON TABLE "public"."real_estate_usages" TO "service_role";



GRANT ALL ON TABLE "public"."real_estates" TO "anon";
GRANT ALL ON TABLE "public"."real_estates" TO "authenticated";
GRANT ALL ON TABLE "public"."real_estates" TO "service_role";



GRANT ALL ON TABLE "public"."real_estates_garages" TO "anon";
GRANT ALL ON TABLE "public"."real_estates_garages" TO "authenticated";
GRANT ALL ON TABLE "public"."real_estates_garages" TO "service_role";



GRANT ALL ON TABLE "public"."real_estates_rest_facilities" TO "anon";
GRANT ALL ON TABLE "public"."real_estates_rest_facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."real_estates_rest_facilities" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON TABLE "public"."settings_couriers" TO "anon";
GRANT ALL ON TABLE "public"."settings_couriers" TO "authenticated";
GRANT ALL ON TABLE "public"."settings_couriers" TO "service_role";



GRANT ALL ON TABLE "public"."settings_delivery_areas" TO "anon";
GRANT ALL ON TABLE "public"."settings_delivery_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."settings_delivery_areas" TO "service_role";



GRANT ALL ON TABLE "public"."settings_facilities" TO "anon";
GRANT ALL ON TABLE "public"."settings_facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."settings_facilities" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."usage_type_values" TO "anon";
GRANT ALL ON TABLE "public"."usage_type_values" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_type_values" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_accidents" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_accidents" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_accidents" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_inspection" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_inspection" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_inspection" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_insurances" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_insurances" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_insurances" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_leases" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_leases" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_leases" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_mileage" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_mileage" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_mileage" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_purchases" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







