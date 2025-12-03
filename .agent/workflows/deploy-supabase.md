---
description: How to deploy the database to Supabase Production
---

# Supabase Production Deployment Guide

This guide explains how to create a production project on Supabase and deploy your local schema to it.

## 1. Create a Project on Supabase Dashboard

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) and log in.
2.  Click **"New project"**.
3.  Select your organization.
4.  Fill in the details:
    *   **Name**: `pantore-app-prod` (or your preferred name)
    *   **Database Password**: Generate a strong password and **save it securely** (you will need it later).
    *   **Region**: Select a region close to your users (e.g., `Tokyo (ap-northeast-1)`).
5.  Click **"Create new project"**.
6.  Wait for the project to finish setting up (it takes a few minutes).

## 2. Link Local Project to Production

Once the project is ready:

1.  In the Supabase Dashboard, go to **Project Settings** (cog icon) -> **General**.
2.  Copy the **Reference ID** (it looks like `abcdefghijklmno`).
3.  In your terminal, run the following command (replace `<project-ref>` with your ID):

```bash
npx supabase link --project-ref <project-ref>
```

4.  You will be asked for your database password (the one you created in step 1).

## 3. Push Schema to Production

Now that they are linked, apply your local migrations to the production database:

```bash
npx supabase db push
```

This will execute your `20251203000000_init_schema.sql` on the production database.

## 4. Update Environment Variables

You need to connect your application to the new production database.

1.  In Supabase Dashboard, go to **Project Settings** -> **API**.
2.  Copy the **Project URL** and **anon public key**.
3.  Update your `.env` (or `.env.local` / Vercel Environment Variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> [!IMPORTANT]
> If you are deploying to Vercel, make sure to add these variables in the Vercel Project Settings.

## 5. Verify

1.  Visit your production application URL.
2.  Try to log in or sign up.
3.  Check if the data is being saved to the production database (you can view it in the Supabase Dashboard Table Editor).
