# QEC / Quantum Intelligence Lab

Interactive quantum error-correction research app by P. Lakshmi Chaitra. Explore repetition-code bit-flip correction, inject X errors, and compare minimum-weight decoding with a newly trained bidirectional LSTM.

## Run locally

```sh
python3 -m http.server 4187
```

Open http://localhost:4187. The static app runs entirely in the browser; it does not upload experiment data or require API keys.

## Validate

```sh
node tests/test-core.js
```

Tests exhaust every error pattern at distances 3, 5, and 7, verify syndrome consistency and bounded-weight correction, and compare exact logical-error probabilities with the binomial expression. Trained decoder predictions agree with the optimal baseline on every possible syndrome at these distances.

## Reproduce training

Install Python, NumPy and PyTorch, then run:

```sh
python3 train.py
```

The BiLSTM uses 32 hidden units per direction and a linear output. Training minimizes probability-weighted binary cross entropy over all error patterns at a mixture of physical error rates 0.05, 0.10, 0.15 and 0.20, with seed 42 and 650 epochs. Checkpoints and exhaustive syndrome predictions are in `models/`. The website uses those precomputed predictions, rather than running PyTorch in the browser.

## Scientific scope

This reconstruction covers independent X errors on an odd-distance repetition code, with one perfect syndrome round. It does not model phase errors, measurement noise, or surface codes. It is a new reconstruction, not the missing original model. The minimum-weight baseline is optimal for this noise model below a 50% physical error probability. Metrics are exact enumeration results; the decorative orbital visualization is conceptual artwork.

The site respects reduced-motion preferences and supports desktop and mobile layouts.
