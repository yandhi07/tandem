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

## Prototype limits

This is still a front-end prototype. It does not connect to Supabase, send real email or OTP messages, verify passwords, synchronize accounts across browsers, or deliver messages to other people. Sign in uses a saved local email and accepts any non-empty demo password. Connect Supabase Auth, Postgres, and Storage before using real student data. The included profiles and posts are sample content.

## Easy edits

- Change landing-page copy and colors in `index.html`.
- Edit sample students in the `starterPeople` array in the script.
- Add preference choices in the `tagGroups` object.
- Adjust the campus list in the `campuses` array.
- Change onboarding, feed, suggestion, chat, and profile behavior in the clearly named functions in the script.
- Adjust layout and mobile styles in the `<style>` block.
