---
slug: finance-tracker
title: Personal Finance Tracker
tagline: A Flutter app for tracking income and spending, saving towards shared goals with friends, and keeping a wishlist, backed by Supabase.
years: 2025–2026
role: Flutter app and Supabase backend: schema, row-level security, auth, charts and theming
status: Working prototype
repo: https://github.com/Krupa1316/Financetracker
stack: [Flutter, Dart, Supabase, PostgreSQL, Row Level Security, Provider, fl_chart]
---

## Overview
A mobile finance app that combines personal money tracking with a small social layer. You log income and expenses, see where the money goes, and save towards goals together with friends in shared groups, such as a trip fund where each person can see the progress on every goal.

It runs on Flutter (Android and iOS; these captures use a Flutter web build) with Supabase providing authentication, a PostgreSQL database and row-level security, so each user can only ever reach their own data and the groups they belong to.

## How it works
1. **Auth.** Supabase Auth handles sign-up and sign-in. A database trigger creates each new user's profile row, with a randomly assigned personal colour.
2. **Data model.** Six tables (`users`, `transactions`, `groups`, `group_members`, `group_goals` and `wishlist_items`) hold the app's data, with foreign keys and cascading deletes.
3. **Security.** Row-level security is enabled on every table. Transactions and wishlist items are visible only to their owner; groups, members and goals only to the group's members.
4. **Dashboard.** Transactions are loaded per user and aggregated on the device into total balance, income and expenses, a monthly income-against-expense trend and a category breakdown, drawn with `fl_chart`.
5. **Groups and goals.** A group has members and goals. Each goal has a target, a current amount and a priority, shown as a progress bar.
6. **Personalisation.** Light, dark or system theme through a Provider, a personal accent colour, and priority colours derived from it.

## Features
- Income and expense tracking with categories, notes and dates; filter, sort, edit and delete
- Dashboard with total balance, monthly trend chart and expense-category breakdown
- Shared groups with members and savings goals, each with priority and progress
- Wishlist with price, category, priority, target date, and pending/completed tracking
- Light, dark and system themes, plus a personal accent colour
- Supabase Auth, with row-level security on every table

## Results
- Fresh setup on a local Supabase: all 5 migrations applied and row-level security enabled on all 6 tables. Source: `supabase start` and `psql`, see the capture below
- Ran end to end in the browser (Flutter web build) against that database: sign-in, dashboard, charts, groups, wishlist, profile and theme switching. Source: the screenshots

## Challenges and decisions
- **Security in the database, not the app.** Access rules live in Postgres row-level security policies, so a bug in the client can't expose another user's transactions.
- **Profile creation as a trigger.** A trigger on `auth.users` creates the profile row inside the database, so a sign-up can't succeed while the profile insert fails.
- **What a fresh setup revealed.** The original migration created a policy on `groups` that referenced `group_members` before that table existed, so it only worked on the project where it was built step by step. For this run, tables were created before policies. Also, group members can't see each other's names yet, because a user may only read their own profile row.

## Run it
```
supabase start                      # local Postgres, Auth and REST API in Docker
# put the local API URL and anon key into .env
flutter run                         # or: flutter build web
```

## Note on these captures
Captured on 14 Oct 2026 against a **local** Supabase running in Docker, with demo accounts and demo data created for the screenshots (no real financial data). Screens were captured at phone size (412×915) and arranged three to a panel.

## Screenshots
- 01-dashboard.png — The dashboard: total balance, income and expenses, the monthly trend chart, the expense-category breakdown and the add-transaction sheet.
- 02-groups-and-wishlist.png — A shared "Goa Trip 2027" group with its savings goals and progress, and the wishlist with priorities and completed items.
- 03-light-mode-and-sign-in.png — Profile with the theme switcher and personal colour, the dashboard in light mode, and the sign-in screen.

## Terminal captures
- 01-local-supabase.txt — Starting a local Supabase: all five migrations apply, and row-level security is on for every table.
