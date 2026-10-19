---
title: "Location search in MongoDB with 2dsphere indexes: listings near you"
description: "Just Rent It shows rental listings sorted by distance from the person searching. The first attempt computed distances in JavaScript over every listing. The second used a 2dsphere index and $geoNear. Here is the schema, the query, and the two mistakes that return nothing."
date: 2027-02-15T03:30:00Z
tags: [mongodb, mongoose, geospatial, nodejs]
keywords: [mongodb geospatial query near, 2dsphere index mongoose, mongodb $geoNear distance, find nearby locations mongodb, geojson point mongoose schema]
project: justrentit
image: /blog/stock/map-1.webp
imageAlt: "Old printed city map"
imageCredit: "AnonymousUnknown author"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Canton1920_d006_map_of_the_city.jpg"
imageLicense: "Public domain"
summary: "Store coordinates as GeoJSON points, add a 2dsphere index, and query with $geoNear or $near to get listings sorted by distance from the searcher with the distance included. Computing distances in JavaScript over every listing stops working at a few thousand rows."
faq:
  - q: "How do I store a location in MongoDB for distance queries?"
    a: "As a GeoJSON Point with coordinates in longitude, latitude order, under a field that has a 2dsphere index."
  - q: "What is the difference between $near and $geoNear?"
    a: "$near is a find operator; $geoNear is an aggregation stage that also returns the computed distance and allows further stages such as filters and pagination."
  - q: "Why are my results in the wrong place?"
    a: "Latitude and longitude were swapped. GeoJSON is longitude first."
---

"Show me cameras available within 10 km" is the whole point of a local rental marketplace. My first implementation fetched every active listing and sorted by a Haversine distance computed in Node. It worked for 200 listings and would have died at 20,000. MongoDB does this natively, and the query is faster than the JavaScript loop even at small sizes.

## The schema

Store coordinates as GeoJSON, longitude first. This is the mistake everyone makes once: GeoJSON is `[lng, lat]`, maps and humans say "lat, lng".

```js
const listingSchema = new Schema({
  title: String,
  status: { type: String, enum: ["active", "paused"], index: true },
  location: {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
});
listingSchema.index({ location: "2dsphere" });
```

If you store `[lat, lng]`, the index still builds and every query returns listings from the middle of the ocean. Validate on write:

```js
listingSchema.path("location.coordinates").validate(
  ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
  "Coordinates must be [longitude, latitude]",
);
```

## The query

`$geoNear` must be the first stage of an aggregation. It sorts by distance and can add the distance to each document:

```js
const listings = await Listing.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [userLng, userLat] },
      distanceField: "distanceMeters",
      maxDistance: 10_000,              // metres
      query: { status: "active", category },
      spherical: true,
    },
  },
  { $limit: 50 },
  { $project: { title: 1, price: 1, photos: { $slice: ["$photos", 1] }, distanceMeters: 1 } },
]);
```

`query` filters inside the stage, using the geo index first and the regular fields second. Keep the status filter there rather than in a later `$match`, or MongoDB finds the 50 nearest listings and then throws away the paused ones, leaving you with fewer results than you asked for.

Show the distance in a friendly unit:

```js
const km = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
```

## Getting the user's location

Ask the browser, and have a fallback for people who say no:

```ts
export function getPosition(): Promise<[number, number]> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve([p.coords.longitude, p.coords.latitude]),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    ),
  );
}
```

The fallback on Just Rent It is a city picker that maps to a stored centre point. Many people decline location prompts and still want results.

## Paginating by distance

`skip` works on `$geoNear` output but gets slow for deep pages like anywhere else. For "load more", pass the last distance seen and use `minDistance`:

```js
$geoNear: { ..., minDistance: lastDistanceMeters + 0.001 }
```

Ties at identical distances are rare with real coordinates, and the tiny offset avoids repeating the boundary item.

## Two mistakes that return nothing

1. **Index missing or wrong type.** `$geoNear` errors with "unable to find index for $geoNear query". Run `db.listings.getIndexes()` and look for `2dsphere`. A `2d` index is the legacy flat one and will not do.
2. **Swapped coordinates**, covered above. If results are empty or absurd, print the stored coordinates of one listing you know and check which number is which. Surat is roughly `[72.83, 21.17]`.

## When MongoDB is not enough

Distance queries with a few filters are exactly what `$geoNear` is for. Full-text search combined with distance, like "canon lens near me", pushes past it; the options are Atlas Search with geo facets, or Postgres with PostGIS and full-text search together. Just Rent It did not need either. Most marketplaces at the start do not.

## Sources

- 2dsphere indexes: [mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere](https://www.mongodb.com/docs/manual/core/indexes/index-types/geospatial/2dsphere/)
- `$geoNear` stage: [mongodb.com/docs/manual/reference/operator/aggregation/geoNear](https://www.mongodb.com/docs/manual/reference/operator/aggregation/geoNear/)
- GeoJSON specification, coordinate order: [datatracker.ietf.org/doc/html/rfc7946#section-3.1.1](https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1)
- Geolocation API: [developer.mozilla.org/en-US/docs/Web/API/Geolocation_API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
