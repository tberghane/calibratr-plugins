# Sample queries

Copy-paste starting points for `calibratr-sourcing-intelligence`. Run in the Claude Code CLI.

## Sourcing

```
/source staff backend engineer, Go or Rust, distributed systems, remote US
/source ML researcher working on retrieval / RAG, published in the last 2 years
/source founding engineer who has launched a dev-tools product
/source https://jobs.lever.co/acme/staff-platform-engineer
```

## Role DNA (structured criteria from a JD)

```
/role-dna https://boards.greenhouse.io/acme/jobs/123456
/role-dna <paste a job description>
```

## Deep dive on one candidate

```
/dossier https://github.com/torvalds
/dossier <paste a resume>
/dossier Jane Doe, Staff SRE at Datadog
```

## Score & rank

```
/score rank the candidates from the last search against the role
/score <candidate> against the Staff Backend Engineer role
```

## Calibrate (after you've recorded ≥10 advance/reject decisions)

```
/calibrate the Staff Backend Engineer role from my recorded verdicts
```

## With a config

Drop `examples/config.example.json` at `.calibratr/config.json` in your project, edit the company
values / default sources / rubric weights, and the commands above will use them as defaults.
