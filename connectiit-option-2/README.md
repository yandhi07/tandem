# connectIIT

A small, editable, browser-based prototype for a campus social and professional community.

## Run it

Open `index.html` in a modern browser. No build step or package install is needed.

## What works in this prototype

- Landing page with a get-started flow
- Create and edit a local demo profile
- Choose a social or professional goal
- Starter profiles with simple shared-interest matching
- Send local demo connection requests
- Publish personal or professional text posts
- Attach a small image to a post
- Keep your profile, connections, and posts in this browser using local storage

## Important prototype limitation

This version does **not** yet use Supabase. The profile and posts live only in the browser where they were created; there is no real account, cross-device sync, or private messaging. The sample student profiles are fictional demo data. The app is written in one `index.html` file so a beginner can quickly edit its text, colors, and behavior. For a team build, the next step is to connect Supabase Auth, Postgres, Storage, and row-level security.

## Easy edits

- Change name, page copy, and sample posts in `index.html`.
- Change theme colors in the `:root` section near the top of the `<style>` block.
- Change sample profiles in the `starterPeople` array in the `<script>` block.
- Change onboarding fields in `openSignup()`.
- Change recommendation behavior in `matched()` and `renderSuggestions()`.
