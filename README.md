# Moments

Photo, video & VHS digitisation and restoration — marketing site with an interactive
before/after slider, a live RM price calculator, and a lead-capture form backed by Supabase.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- Framer Motion (scroll/interaction animations)
- Supabase (`leads` table for the contact form)

## Local dev
```bash
npm install
cp .env.example .env   # fill in your Supabase project values
npm run dev
```

## Supabase setup
1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor — creates the `leads` table with
   row-level security so the public anon key can only INSERT, never read.
3. Copy the project URL and anon key into `.env` (or Netlify env vars) as
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Deploy to Netlify
1. Push this repo to GitHub/GitLab.
2. New site from Git in Netlify, build command `npm run build`, publish dir `dist`
   (already set in `netlify.toml`).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Netlify environment variables.

## Replacing placeholder content
- Hero and use-case images are Unsplash placeholders — swap for real before/after
  photos in `src/components/Hero.tsx` and `src/components/UseCases.tsx`.
- Testimonials in `src/components/Testimonials.tsx` are illustrative — replace with
  real customer quotes once available.
- Pricing rates (`PHOTO_RATE`, `TAPE_RATE`, `BASE_FEE`) live in
  `src/components/PriceCalculator.tsx` — tune to your actual cost structure.
