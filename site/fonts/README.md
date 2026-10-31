# Website fonts

The landing page serves its three typefaces from this folder, so a visitor's browser asks nothing of anyone else's server; the product makes the same promise for its own pages ([docs/privacy.md](../../docs/privacy.md)). `fonts.css` declares them and `index.html` links it.

The files are the Latin and Latin Extended subsets as Google Fonts serves them (variable weight where the family has one), unchanged. Every character on the page is in those subsets; a visitor whose browser lacks a glyph falls back to the system font stack named in the page's CSS.

| Family | Files | Upstream | Licence |
|---|---|---|---|
| Geist, weights 400 to 800 | `geist-latin.woff2`, `geist-latin-ext.woff2` | [Google Fonts Geist](https://github.com/google/fonts/tree/main/ofl/geist) | [OFL 1.1](geist-OFL.txt) |
| Geist Mono, weights 400 to 500 | `geist-mono-latin.woff2`, `geist-mono-latin-ext.woff2` | [Google Fonts Geist Mono](https://github.com/google/fonts/tree/main/ofl/geistmono) | [OFL 1.1](geistmono-OFL.txt) |
| Instrument Serif, italic | `instrument-serif-italic-latin.woff2`, `instrument-serif-italic-latin-ext.woff2` | [Google Fonts Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif) | [OFL 1.1](instrumentserif-OFL.txt) |

To refresh them, download the `woff2` files that the Google Fonts CSS names for the Latin subsets and replace the files here; keep the licence files with them, as the SIL Open Font License asks.
