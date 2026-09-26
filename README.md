# MA Decision Register — decision form

A form with the 13 register lines that need an answer. People sign in with just a username (no password), choose Accept / Edit / Reject for each line, add notes, and submit.

**Live form:** https://baraakhaldi.github.io/MA-Decision-Register/

Answers are saved to `data/answers/<username>.json` in this repo by a small Cloudflare Worker (`worker/`). The Worker holds the GitHub token as the secret `GITHUB_TOKEN`; no token is needed in the browser.

Anyone who knows a username can view or change that person's answers, and the answer files are public.
