# Applied Statistics & Data Science I: course portfolio

An interactive record of my work through Johns Hopkins course 413/613 *Applied Statistics & Data Science I* (Fall 2026, Prof. Suryanarayana Maddu).

**Live site:** https://sahiljangra12.github.io/asda-course-portfolio/

## What is here

- **Course map.** All 16 lectures in six modules, each summarised in my own words with its key formula.
- **12 interactive labs.** Binomial explorer, random variables in NHANES data, the central limit theorem, hypothesis tests and confidence intervals, Poisson maximum likelihood, the bootstrap, Bayesian updating, the 2D Gaussian, simple and multiple regression, ridge, and bias-variance with cross-validation. One lab downloads live earthquake data from the USGS.
- **6 data reports.** NHANES, Prussian horse kicks, Michelson's speed of light, Palmer penguins, diabetes progression and iris.

## How it works

Plain HTML, CSS and JavaScript with no build step and no charting library.

| File | Purpose |
|---|---|
| `assets/js/stats.js` | Distributions, seeded random numbers, least squares, ridge, t quantiles |
| `assets/js/charts.js` | SVG chart helper with hover tooltips |
| `assets/js/labs.js` | The twelve labs |
| `assets/js/reports.js` | The six reports; every figure in the text is computed from the data |
| `assets/js/data.js` | The six datasets |

The course notebooks are in Python. Their analyses are re-implemented here in JavaScript and were checked against the notebook outputs (for example, the penguin regression gives intercept -5780.83 g and slope 49.69 g/mm, and the ten-predictor diabetes model matches every coefficient and standard error).

To run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Credits

The course, its choice of examples and its datasets are Prof. Maddu's. Lecture notes, assignments, solutions and exams belong to the course and are not included in this repository.

Data: CDC/NCHS NHANES 2017-2018 (used unweighted); Bortkiewicz's horse-kick data; Michelson (1879); Palmer penguins (Gorman, Williams and Fraser, 2014); diabetes (Efron et al., 2004, via scikit-learn); iris (Fisher, 1936); USGS earthquake catalogue. KaTeX (MIT), Bricolage Grotesque and Public Sans (SIL OFL).
