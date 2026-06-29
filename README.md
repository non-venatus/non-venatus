# Non-Venatus Website
**Hidam Premananda · Bloomsbury, 2026**

A GitHub Pages website for *Non-Venatus: On the Production of Wars and Universities*.

---

## Quick Start

1. Upload this entire folder to a GitHub repository
2. Go to **Settings → Pages → Branch: main → Save**
3. Your site will be live at `https://your-username.github.io/your-repo-name/`
4. Set up Supabase for the comments feature (see below)

---

## File Structure

```
/
├── index.html              ← Homepage
├── engagements.html        ← Book Engagements (carousel)
├── interactions.html       ← Reddit-style comments
├── about.html              ← About the book & Read-Act
├── admin.html              ← Password-protected admin dashboard
├── _config.yml             ← Jekyll site settings (editable)
├── _layouts/               ← Page templates
├── _includes/              ← Reusable components (nav, sidebar, footer)
├── _data/
│   ├── reception.yml       ← EDIT: Book reception quotes ← EDITABLE
│   └── engagements.yml     ← EDIT: Events/engagements   ← EDITABLE
├── assets/
│   ├── css/style.css       ← All styles
│   └── js/
│       ├── config.js       ← EDIT: API keys & settings  ← EDITABLE
│       ├── app.js          ← Shared JS (nav, scroll)
│       ├── carousel.js     ← Engagements carousel
│       ├── interactions.js ← Comment system
│       └── admin.js        ← Admin dashboard
└── img/                    ← Images (see img/README.txt)
```

---

## Editing Content (No coding required)

### Add a book reception quote
Edit `_data/reception.yml`:
```yaml
- name: "Professor Name"
  title: "Their Role"
  institution: "Their University"
  text: "Their quote about the book."
```

### Add an event
Edit `_data/engagements.yml`:
```yaml
- id: "unique-id-here"
  title: "Event Title"
  date: "Month Year"
  venue: "Venue Name, City"
  short_desc: "One line description"
  image: "img/your-event-photo.jpg"
  popup_text: >
    Full description of the event that appears
    when someone clicks on the event card.
  tags: ["Tag1", "Tag2"]
```

### Edit About page text
Edit `about.html` — it's standard HTML with clear section comments.

### Change site title, author, ISBN
Edit `_config.yml`.

---

## Setting Up Comments (Supabase)

The Interactions page requires a free Supabase account.

### Step 1: Create Supabase project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to your users)

### Step 2: Create the comments table
In your Supabase dashboard, go to **SQL Editor** and run:

```sql
CREATE TABLE public.comments (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  name        text        NOT NULL,
  email       text        NOT NULL,
  affiliation text,
  comment     text        NOT NULL,
  status      text        NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Allow anyone to read approved comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved" ON public.comments
  FOR SELECT USING (status = 'approved');

-- Allow anyone to submit new comments
CREATE POLICY "Public insert" ON public.comments
  FOR INSERT WITH CHECK (true);
```

### Step 3: Get your API keys
In Supabase: **Settings → API**
- Copy **Project URL** → `SUPABASE_PROJECT_URL`
- Copy **anon / public key** → `SUPABASE_ANON_KEY`  
- Copy **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Configure the website
Edit `assets/js/config.js`:
```javascript
supabase: {
  url:            'https://xxxx.supabase.co',   // paste URL
  anonKey:        'eyJ...',                      // paste anon key
  serviceRoleKey: 'eyJ...'                       // paste service role key
},
admin: {
  password: 'your-secure-password'  // change this!
}
```

### Step 5: Confirm email notifications
The first time someone submits a comment, FormSubmit.co will send a confirmation
email to `readactsessions@gmail.com`. Click the confirm link to activate email notifications.

---

## Admin Dashboard

Access at: `yoursite.com/admin.html`

Default password: `nonvenatus2026` (change in `config.js` before deploying)

The dashboard shows three tabs:
- **Pending** — new submissions awaiting review
- **Approved** — comments visible on the Interactions page
- **Rejected** — declined comments

Move comments between tabs using the action buttons.

---

## Adding Images

Place image files in the `/img/` folder:

| Filename | Purpose |
|---|---|
| `cover-thumb.jpg` | Sidebar front cover (auto-generated from PDF) |
| `cover-back-thumb.jpg` | Sidebar back cover on hover |
| `author-thumb.jpg` | Author round photo in sidebar |
| `artwork.jpg` | Background texture |
| `cover-front.jpg` | Full-size cover for popup |

To replace with higher-quality covers: add your images with the same filenames.

---

## Cover Art Credit

Cover artwork by **Simran Ngangbam**  
Cover design by **Kapil Gupta**

---

## License

Website © 2026 Hidam Premananda. Book © Bloomsbury Academic 2026.
