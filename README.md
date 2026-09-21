# Task 1 (Variant): Dorm Room Booking API

You are building the backend for a dorm common-room booking system. Anyone
can browse and book a room for a time range — there's no login for this
variant.

Express + MongoDB (Mongoose), one entity that needs full CRUD and request
validation. The wrinkle in this variant is conflict detection that a
schema can't do for you.

## What's already done for you

- `server/src/index.js`, `server/src/app.js`, `server/src/config/db.js` —
  app bootstrap and DB connection.
- `server/src/models/User.js` — a plain user schema (`name`, `email`,
  `password`). It's not tied to any login flow here; it exists so
  `Booking.bookedBy` has something to reference.
- `server/src/controllers/userController.js` + `server/src/routes/users.js`
  — full CRUD over users, already wired, as a worked example of what your
  `bookingController.js` should look like structurally (validation → DB
  call → response, one function per route).

Run `npm install` then `npm run dev` inside `server/` once you've filled in
the TODOs below. There is no `.env` provided — create your own
`server/.env` (it's git-ignored) with the keys below.

## Database connection

Create `server/.env` yourself with:

```
PORT=4000
MONGO_URI=mongodb://tasks:pass1234@ac-j3acrgb-shard-00-00.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-01.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-02.lueesfz.mongodb.net:27017/?ssl=true&replicaSet=atlas-6to6iy-shard-0&authSource=admin&appName=Cluster0
```

## What you need to build

### 1. The `Booking` model — `server/src/models/Booking.js`

| field | type | rules |
|---|---|---|
| `roomNumber` | String | required |
| `startDate` | Date | required |
| `endDate` | Date | required |
| `purpose` | String | optional |
| `bookedBy` | ObjectId ref `User` | optional, plain field like any other |

Add `{ timestamps: true }`. No unique index in this variant — conflicts
are a range-overlap problem, not an exact-duplicate problem, so an index
can't express the rule you need.

### 2. Validation — inside `server/src/controllers/bookingController.js`

Joi (or your choice) schema for create/update. `startDate` must be
strictly before `endDate` — validate this explicitly, Joi won't infer it
from the types alone.

### 3. Controller + routes

Implement full CRUD over bookings — create, read one, read all, update,
and delete. Creating or updating a booking needs to reject it with a
conflict error if it overlaps an existing one on the same room, per
section 4. Decide the paths and HTTP methods yourself, following standard
REST conventions.

### 4. Conflict detection — the actual point of this variant

Two bookings on the **same room** conflict if their date ranges overlap.
Before creating (or updating) a booking, you need a way to check for any
existing booking on the same `roomNumber` whose range overlaps the
proposed one, and reject with `409` if one exists. On update, make sure a
booking doesn't conflict with itself.

This is not something Joi or a Mongoose validator can express on its own —
it requires a real database query as part of your write logic, which is
different from every other validation you've written so far. Work out the
overlap condition for two ranges yourself before you write the query.

### 5. Stretch goal — populate

Use Mongoose's `.populate('bookedBy')` on `getAllBookings`/`getBooking` so
the response includes the referenced user's `name`/`email` instead of just
an id.

You're expected to use AI tools while building this — that's fine and
expected. But you should be able to explain, for any line in your
controller, *why* it's there and what happens if you delete it. We will ask.
