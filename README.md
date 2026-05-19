# ESCAPE Festival Website

This site is prepared for Netlify + Decap CMS.

## Admin

After publishing and enabling Netlify Identity + Git Gateway, edit the site at:

```text
https://your-netlify-site.netlify.app/admin/
```

Editable areas include text, hero image, lineup, ticket link, gallery photos, sponsor logos, FAQs and contact details.

## If Image Uploads Do Not Work

Check these in Netlify:

1. Identity is enabled.
2. Git Gateway is enabled.
3. Your invited user has accepted the invite and can log in at `/admin/`.
4. The repository contains this folder:

```text
assets/uploads
```

5. After choosing a new hero image in `/admin/`, click **Save**.

The CMS writes uploaded images to:

```text
assets/uploads
```

and updates:

```text
content/site.json
```

## Netlify Build Settings

Use:

```text
Build command: leave blank
Publish directory: .
```
