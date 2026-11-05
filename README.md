# CineVerse — Netlify-ready starter

A responsive, Netflix-inspired movie discovery site with:
- Public movie catalog, search, genre filters and detail modal
- Browser-local My List and Continue Watching (no viewer accounts)
- Separate admin login and protected server-side admin API
- Movie/category/settings/ad management
- Ad placements for banner, direct link and trusted network script snippets
- Netlify Functions + Netlify Blobs persistence

## Important deployment note

This project is **not a static drag-and-drop-only site** because secure admin login and persistent management use Netlify Functions and Netlify Blobs. Deploy it using Git integration or Netlify CLI so the functions are built and deployed.

## Deploy from a phone (recommended: GitHub + Netlify)
1. Create a GitHub repository and upload the contents of this ZIP (extract it first).
2. In Netlify, choose **Add new site → Import an existing project**.
3. Connect the GitHub repository.
4. Build command: `npm run build`
5. Publish directory: `public`
6. Add environment variables in Netlify → Site configuration → Environment variables:
   - `ADMIN_EMAIL` = your chosen admin email
   - `ADMIN_PASSWORD` = a strong unique password (do not use the demo password)
   - `JWT_SECRET` = a long random secret (at least 32 characters)
7. Deploy. Netlify Functions are discovered from `netlify/functions`.
8. Open `https://YOUR-SITE.netlify.app/admin.html` and sign in.

## Deploy with Netlify CLI
1. Install Node.js and Netlify CLI on a computer.
2. Run `npm install`
3. Run `npx netlify login`
4. Run `npx netlify init`
5. Set the three environment variables in the Netlify dashboard.
6. Run `npm run deploy` (or `npx netlify deploy --build`).

## Admin API / security
- Password is checked in a Netlify Function; credentials are never embedded in frontend code.
- Admin API routes require a signed bearer token.
- Change `ADMIN_PASSWORD` and `JWT_SECRET` before deploying.
- The initial admin email/password are not preconfigured.
- Keep admin credentials private. Enable MFA on the GitHub/Netlify accounts too.

## Ads
Admin → Ads supports:
- Direct-link ads (click opens advertiser URL)
- Banner image + destination URL
- Trusted network script snippets (for example, code supplied by Adsterra)
Only paste code from an ad provider you trust. Third-party scripts can track visitors and execute code in the page. Add required privacy/cookie notices for your jurisdiction and ad network.

## Content and copyright
The demo catalog is fictional. Add only movie artwork, trailers and video sources you own, have licensed, or are otherwise authorized to use. This project does not scrape or host copyrighted films. Video URLs must be legal and compatible with the browser.

## Data persistence
Movies, categories, settings and ad placements are stored in Netlify Blobs after the first function request. My List and Continue Watching are stored in each visitor's browser localStorage. Back up your Netlify site data before major changes.

## Limitations in this starter
- No viewer registration/login by design.
- Watchlist/history are per-browser, not synced across devices.
- No payment/subscription system.
- Ratings/reviews are not yet a moderated multi-user service.
- Uploading media files is not included; use trusted public image URLs.
- Netlify Blobs are persistent app data, not a full relational database.
