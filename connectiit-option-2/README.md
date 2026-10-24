# connectIIT

An editable, browser based prototype for a campus community that brings together friendships and professional connections.

## Run it

Open `index.html` in a modern browser. No build step or package install is needed.

## What the demo includes

- Animated Earth intro and landing page with sign in and join actions
- Three step onboarding for identity, IIT academics, interests, and professional goals
- A visible demo OTP (`246810`) for judge demonstrations
- Personal and professional feeds, each with sample posts and suggested profiles
- Local post creation with a caption, photo, campus tag, and target feed
- A messages list and local chat windows
- A suggestion card with campus illustration, shared interests, and Yes / No actions
- Profile photo and IIT banner uploads, editable highlights, follow / unfollow, and media / post tabs
- Demo profiles, posts, follows, and messages saved in this browser's local storage

## Supabase authentication

The app creates email-and-password accounts in Supabase Auth and saves the basic profile in the `public.profiles` table. Supabase project URL and publishable key are configured in `js/supabase.js`; browser code must use only the publishable key, never a secret or service-role key.

The profile upsert expects `profiles` columns `id` (UUID matching `auth.users.id`), `name`, `detail`, `interests`, `goals`, `emoji`, and `bio`. Enable row-level security and allow an authenticated user to select, insert, and update only their own row (`auth.uid() = id`). If Supabase email confirmation is enabled, users must confirm their email before signing in; sending confirmation emails to IIT addresses requires a configured SMTP provider. The six-digit OTP shown during onboarding is still a demo code and is not emailed.

Posts, messages, and other app data remain local demo data; only Supabase Auth accounts and basic profile rows are synchronized.
## Easy edits

- Change landing-page copy and colors in `index.html`.
- Edit sample students in the `starterPeople` array in the script.
- Add preference choices in the `tagGroups` object.
- Adjust the campus list in the `campuses` array.
- Change onboarding, feed, suggestion, chat, and profile behavior in the clearly named functions in the script.
- Adjust layout and mobile styles in the `<style>` block.
