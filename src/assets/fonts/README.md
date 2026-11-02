# Homepage fonts

The site uses HarmonyOS Sans, Playball, Long Cang and UnidreamLED.

- HarmonyOS files are unmodified copies of the WOFF2 files already referenced by `public/css/font/HarmonyOS_Regular.css`, originally served from `s1.hdslb.com/bfs/static/jinkela/long/font/`. Their filenames and contents are retained. The build adds content hashes to their URLs.
- Playball is converted from the repository's original TTF to WOFF2.
- Long Cang is converted from the original TTF into a common subset and disjoint fallback subsets. All 7,015 original Unicode characters remain available.
- UnidreamLED is converted from the repository's existing TTF; its embedded copyright and naming records are retained.

HarmonyOS, Playball and Long Cang license notices are included in `public/font-licenses/` and copied into the deployed site. Original TTF and CSS files remain under `public/css/font/` as generation inputs.

To regenerate after editing site text or replacing the original avatar, run `python scripts/prepare-site-assets.py` with Pillow and `fonttools[woff]` installed. Generated assets are included in the source tree; Python is not required for deployment.
