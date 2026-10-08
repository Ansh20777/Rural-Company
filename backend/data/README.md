# PIN code coordinates

`pincodes.json` maps a 6-digit Indian PIN code to `[latitude, longitude]` (19,258 PIN codes).

Source: Department of Posts, Government of India - All India Pincode Directory (data.gov.in, open data),
as compiled in https://github.com/harshvardhaniimi/IndiaPIN. Each PIN's point is the median of its post
offices' coordinates after dropping offices more than 40 km from that median (the raw data has a few bad rows).

Used by `utils/geo.js` for "workers/jobs within N km" searches. Distances are straight-line between PIN
centres, so they are approximate. PIN codes created after the dataset was compiled will not be found.
