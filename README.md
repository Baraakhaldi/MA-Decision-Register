# MA Decision Register — company name questionnaire

The company-name candidates page, turned into a questionnaire for Baraa and Nawaf.

**Live page:** https://baraakhaldi.github.io/MA-Decision-Register/

- Pick **Baraa** or **Nawaf** at the top.
- Vote **Like / Maybe / No** on every candidate; the other founder's vote shows next to yours.
- Section 12 asks for a top 3, a favourite slogan, brand-identity choices, comments and new names, then **Submit**.

Votes save automatically through a Cloudflare Worker (`worker/`) to `data/names/baraa.json` and `data/names/nawaf.json`. The earlier decision-register answers stay in `data/answers/`.
