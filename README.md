# ASDA Lab: learn statistics by running it

Thirteen interactive statistics labs and six data stories, built while taking Johns Hopkins course 413/613 *Applied Statistics & Data Science I* (Fall 2026, Prof. Suryanarayana Maddu). Open it, move a slider, and watch the mathematics respond.

**Live site:** https://sahiljangra12.github.io/asda-course-portfolio/

## What is here

- **13 labs, in learning order.** Each has the idea in plain words with its formula, a live experiment, three missions to try and one question to check yourself: binomial, random variables in NHANES data, earthquakes and the Poisson, the central limit theorem, hypothesis tests, Poisson maximum likelihood, S&P 500 returns, the bootstrap, Bayesian updating, the 2D Gaussian, simple and multiple regression with ridge, and bias-variance with cross-validation.
- **Lectures.** All 16 lectures in six modules, each summarised in my own words with its key formula.
- **6 data stories.** NHANES, Prussian horse kicks, Michelson's speed of light, Palmer penguins, diabetes progression and iris.

## How it works

Plain HTML, CSS and JavaScript with no build step and no charting library.

| File | Purpose |
|---|---|
| `docs/assets/js/stats.js` | Distributions, seeded random numbers, least squares, ridge, t quantiles |
| `docs/assets/js/charts.js` | SVG chart helper with hover tooltips |
| `docs/assets/js/labs.js` | The thirteen labs |
| `docs/assets/js/learn.js` | The idea, missions and quiz for each lab |
| `docs/assets/js/reports.js` | The six reports; every figure in the text is computed from the data |
| `docs/assets/js/data.js` | The eight datasets |

The course notebooks are in Python. Their analyses are re-implemented here in JavaScript and were checked against the notebook outputs (for example, the penguin regression gives intercept -5780.83 g and slope 49.69 g/mm, and the ten-predictor diabetes model matches every coefficient and standard error).

To run locally: `python3 -m http.server` in the `docs` folder, then open http://localhost:8000.

## Credits

The course, its choice of examples and its datasets are Prof. Maddu's. Lecture notes, assignments, solutions and exams belong to the course and are not included in this repository.

Data: CDC/NCHS NHANES 2017-2018 (used unweighted); Bortkiewicz's horse-kick data; Michelson (1879); Palmer penguins (Gorman, Williams and Fraser, 2014); diabetes (Efron et al., 2004, via scikit-learn); iris (Fisher, 1936); USGS earthquake catalogue (magnitude 6.85+, 1900-2025, downloaded 21 Nov 2026); S&P 500 daily closes from FRED (2 Jan 2024 to 5 Oct 2026). KaTeX (MIT), Barlow (SIL OFL).
