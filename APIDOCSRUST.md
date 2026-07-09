# API Documentation — HMPS TRPL (Rust)

Rust rewrite of the Laravel `php/api-hmps` API. Same routes, same response
envelope — served by a from-scratch threaded HTTP server on top of the raw
`mysql` driver (no web framework).

- **Base URL:** `/api/v1`
- **Server:** `http://127.0.0.1:5000` (configurable in `src/config.rs`)
- **Run:** `cargo run`

Response format:

```json
{
  "success": true,
  "message": "string",
  "data": { ... }
}
```

Validation failures add an `errors` object:

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": { "field": ["message"] }
}
```

---

## Authentication

### Public endpoints
No authentication required.

### Protected endpoints (admin)
Require two custom headers (validated by the router before dispatch):

| Header | Value |
|--------|-------|
| `X-User-Author` | `Hylmi` |
| `X-Kampus-User` | `Polmed` |

Missing or wrong headers return `401`.

### Token auth
`POST /api/v1/auth/login` and `/auth/register` return a Sanctum-style token
`{id}|{plaintext}`. The SHA-256 of the plaintext is stored in
`personal_access_tokens`. Send it as `Authorization: Bearer {token}` for
`POST /api/v1/auth/logout`. Passwords use bcrypt (compatible with Laravel `Hash`).

---

## Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1` | Latest published posts for categories 1 & 2 (max 3 each) |
| GET | `/api/v1/posts` | Published posts, paginated (10/page, `?page=`) |
| GET | `/api/v1/posts/{slug}` | Single published post; increments `views` |
| GET | `/api/v1/pages` | Published pages (`published_at` set, `deleted_at` null) |
| GET | `/api/v1/pages/{slug}` | Single published page; increments `views` |
| GET | `/api/v1/categories` | All categories |
| GET | `/api/v1/tags` | All tags with `posts_count` |
| GET | `/api/v1/management-years` | All management years |
| GET | `/api/v1/divisions` | All divisions |
| GET | `/api/v1/positions` | All positions |
| GET | `/api/v1/members` | All members with division/position/managementyear |
| GET | `/api/v1/struktur-organisasi/{yearSlug?}/{divisionSlug?}` | Members filtered by year/division |
| GET | `/api/v1/author/{username}` | Author info + their published posts (paginated) |
| GET | `/api/v1/search?q=` | Search published posts by title/body (paginated) |
| POST | `/api/v1/contact` | Submit a contact message |
| GET | `/api/v1/graduations/check?nim=&managementyear_id=` | Check graduation by NIM and period |
| POST | `/api/v1/auth/login` | Login → `{ user, token }` |
| POST | `/api/v1/auth/register` | Register → `{ user, token }` (201) |

Posts embed `user`, `category`, and `tag` (array); members embed `division`,
`position`, `managementyear`; pages embed `user`.

### Contact body

| Field | Type | Required |
|-------|------|----------|
| `name` | string | yes |
| `email` | email | yes |
| `phone` | string | no *(not stored — no column)* |
| `subject` | string | yes |
| `message` | string | yes |

### Login / Register body

`login`: `email`, `password`.
`register`: `name`, `email`, `username`, `password` (min 6).

---

## Protected Endpoints (Admin)

All require `X-User-Author` and `X-Kampus-User`.

### Dashboard

```
GET /api/v1/admin/stats
```

Aggregate counts for the admin dashboard (shape matches the frontend
`AdminStats`):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "totalPosts": 3,
    "totalMembers": 9,
    "totalDivisions": 3,
    "totalInbox": 2,
    "activePeriod": "2024-2025"
  }
}
```

`totalInbox` = contacts count. `activePeriod` = slug of the most recent
management year.

### Graduations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/graduations` | List all graduations (with `managementyear`, `division`) |
| POST | `/api/v1/admin/graduations` | Create graduation |
| GET | `/api/v1/admin/graduations/{id}` | Show graduation |
| PUT | `/api/v1/admin/graduations/{id}` | Update graduation |
| DELETE | `/api/v1/admin/graduations/{id}` | Delete graduation |

Body: `nim`* (10 digits), `name`*, `managementyear_id`*, `division_id`*, `role`, `accepted` (boolean). When `division_id` is supplied, `division` and `alias` are auto-filled from the divisions table.

### Auth

```
POST /api/v1/auth/logout
```

Requires `Authorization: Bearer {token}`. Deletes the presented token.

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/posts` | List all posts |
| POST | `/api/v1/admin/posts` | Create post |
| GET | `/api/v1/admin/posts/{uuid}` | Show post |
| PUT | `/api/v1/admin/posts/{uuid}` | Update post |
| DELETE | `/api/v1/admin/posts/{uuid}` | Delete post |

Body: `title`* , `body`*, `slug` (auto from title), `excerpt`, `category_id`
(default 1), `status` (`DRAFT`/`PUBLISHED`/`TRASH`, default `DRAFT`), `user_id`
(default 1), `published_at` (default now), `featured_img` (file), `tags` (array
of tag ids). `reading_time` is computed from the body word count.

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/pages` | List |
| POST | `/api/v1/admin/pages` | Create |
| GET | `/api/v1/admin/pages/{uuid}` | Show |
| PUT | `/api/v1/admin/pages/{uuid}` | Update |
| DELETE | `/api/v1/admin/pages/{uuid}` | Delete |

Body: `title`*, `body`*, `slug`, `excerpt`, `user_id` (default 1),
`published_at` (default now), `featured_img` (file).

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/categories` | List (with `posts_count`) |
| POST | `/api/v1/admin/categories` | Create |
| GET | `/api/v1/admin/categories/{id}` | Show |
| PUT | `/api/v1/admin/categories/{id}` | Update |
| DELETE | `/api/v1/admin/categories/{id}` | Delete |

Body: `name`* (unique), `description` *(not stored — no column)*. Deleting a
category that still has posts returns `409`.

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tags` | List (with `posts_count`) |
| POST | `/api/v1/admin/tags` | Create |
| GET | `/api/v1/admin/tags/{slug}` | Show |
| PUT | `/api/v1/admin/tags/{slug}` | Update |
| DELETE | `/api/v1/admin/tags/{slug}` | Delete |

Body: `name`* (unique).

### Media Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/media` | List |
| POST | `/api/v1/admin/media` | Upload (`multipart/form-data`, field `upload`) |
| DELETE | `/api/v1/admin/media/{id}` | Delete |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/members` | List with relations |
| POST | `/api/v1/admin/members` | Create |
| GET | `/api/v1/admin/members/{uuid}` | Show |
| PUT | `/api/v1/admin/members/{uuid}` | Update |
| DELETE | `/api/v1/admin/members/{uuid}` | Delete |

Body: `name`*, `division_id`, `position_id`, `managementyear_id`, `photo`
(file). `nim`, `phone`, `email`, `address`, `bio` are accepted but **not stored**
(no columns).

> The three foreign keys are `NOT NULL` in the DB and validated with `exists:`
> rules — a non-existent id returns `422`, e.g.
> `{"errors":{"position_id":["The selected position_id is invalid."]}}`.
> You must create a Position and a Management Year before members can be added.

### Divisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/divisions` | List (with `members_count`) |
| POST | `/api/v1/admin/divisions` | Create |
| GET | `/api/v1/admin/divisions/{id}` | Show |
| PUT | `/api/v1/admin/divisions/{id}` | Update |
| DELETE | `/api/v1/admin/divisions/{id}` | Delete |

Body: `name`*, `alias`* (unique). Delete with members → `409`.

### Management Years

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/management-years` | List (with `members_count`) |
| POST | `/api/v1/admin/management-years` | Create |
| GET | `/api/v1/admin/management-years/{id}` | Show |
| PUT | `/api/v1/admin/management-years/{id}` | Update |
| DELETE | `/api/v1/admin/management-years/{id}` | Delete |

Body: `start_year`* (2000–2100), `end_year`* (2000–2100, `> start_year`). `slug`
is auto-generated `start-end`. Delete with members → `409`.

### Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/positions` | List (with `members_count`) |
| POST | `/api/v1/admin/positions` | Create |
| GET | `/api/v1/admin/positions/{id}` | Show |
| PUT | `/api/v1/admin/positions/{id}` | Update |
| DELETE | `/api/v1/admin/positions/{id}` | Delete |

Body: `name`* (unique). Delete with members → `409`.

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List (with `roles`) |
| POST | `/api/v1/admin/users` | Create |
| GET | `/api/v1/admin/users/{id}` | Show |
| PUT | `/api/v1/admin/users/{id}` | Update |
| DELETE | `/api/v1/admin/users/{id}` | Delete |

Body: `name`*, `email`* (unique), `username`* (unique), `password`* (min 6),
`bio`, `userimg` (file). `password` and `remember_token` are never returned.

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/contacts` | List |
| GET | `/api/v1/admin/contacts/{id}` | Show |
| DELETE | `/api/v1/admin/contacts/{id}` | Delete |

### Forms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/forms` | List |
| GET | `/api/v1/admin/forms/{id}` | Show |
| DELETE | `/api/v1/admin/forms/{id}` | Delete |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/settings` | List |
| POST | `/api/v1/admin/settings` | Create |
| GET | `/api/v1/admin/settings/{id}` | Show |
| PUT | `/api/v1/admin/settings/{id}` | Update |
| DELETE | `/api/v1/admin/settings/{id}` | Delete |

Body: `key`* (unique), `value`*. (`key` is a reserved word — backticked in SQL.)

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/profile/{id}` | Show |
| PUT | `/api/v1/admin/profile/{id}` | Update (`name`, `email`, `bio`, `username`, `userimg`) |
| PUT | `/api/v1/admin/profile/{id}/password` | `current_password`*, `new_password`* (min 8) |

Wrong current password → `422`.

### Authorization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/authorization` | Users with roles & permissions |
| GET | `/api/v1/admin/authorization/roles` | Roles with permissions |
| GET | `/api/v1/admin/authorization/permissions` | Permission names |
| POST | `/api/v1/admin/authorization/permissions` | Create permission (`name`*, min 3) |
| DELETE | `/api/v1/admin/authorization/permissions` | Delete permission (body `{ "name": "..." }`) |
| PUT | `/api/v1/admin/users/{id}/roles` | Assign roles (body `{ "roles": ["..."] }`) |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Missing/invalid admin headers |
| 404 | Not found |
| 409 | Conflict (delete with dependencies) |
| 422 | Validation failed / incorrect password |
| 500 | Server error |

---

## Implementation notes

- **Verbose logging.** Every request is logged to **stdout** (ANSI-colored)
  only — no log file is written, so nothing accumulates on disk. It includes the
  request line, headers (bearer tokens redacted), body fields (passwords
  redacted), file uploads, every SQL statement, and the response status +
  timing. Redirect stdout yourself (`cargo run > out.log`) if you need a
  persisted trace.
- **Uploads** are stored under `storage/app/public/<subdir>/` (`img/posts`,
  `img/pages`, `img/members`, `img/avatars`, `img/media`); only the basename is
  persisted in the DB.
- **Static assets.** Uploaded files are served at the server root under
  `GET /storage/<path>` → `storage/app/public/<path>` (Laravel public-disk
  convention, *outside* the `/api/v1` prefix). Example:
  `http://localhost:5000/storage/img/members/1699999999_ab12cd34ef.jpg`.
  Content-Type is inferred from the extension; path traversal is rejected (403).
- **Schema fidelity.** The live MySQL schema is authoritative. Fields present in
  the PHP models but absent from the DB are accepted but not stored:
  `posts_categories.description`, `contacts.phone`. `tags.description` is
  `NOT NULL` with no default, so tag creation writes an empty string.
  `hmpstrpl_members.nim` is now stored (added in 2026 migration).
- **Source layout:** see `README.md`.

## Default admin user

- **ID:** 1 (default `user_id` when unspecified)
- **Email:** `admin@hmpstrpl.com`
- **Username:** `admin`
