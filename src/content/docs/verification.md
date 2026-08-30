# What CoreNova verification guarantees

CoreNova Launch publishes an application only after an automated verification run
passes every gate. This page explains what those gates are, so you can judge what
"Verified" means here.

## The publish gate

A version is published only when **all nine checks** pass:

| Check | What it proves |
|-------|----------------|
| Compose started | The application's compose file brought the stack up. |
| Container healthy | The container stayed in a running state. |
| Health check passed | The app answered its readiness endpoint with the expected status. |
| Application tests | Pre-written behavioral tests (API + browser) passed. |
| Version assertion | The running app reports the exact published version. |
| Screenshots captured | Key scenarios were captured as evidence. |
| Artifacts published | Screenshots, report and manifest are readable from public storage. |
| Platform contract valid | The AWS deployment path (AMI/CloudFormation/runtime) was verified and is current. |

Every published record pins its **immutable inputs**: app version, exact image tag,
image digest (sha256), test-suite revision, and the platform contract it referenced.
That is what makes a result reproducible.

## What "referenced" platform means

Application behavior is verified in CI containers. The AWS deployment path
(base image, CloudFormation, Docker runtime) is verified separately and less
frequently — a "Platform Verification". A published app references that platform
contract instead of re-running it every time. This split keeps routine releases
free of AWS cost while the platform gate stays the single source of truth for
infrastructure correctness.

## What we do not claim

GitHub verification proves the **application** works. It does not prove that any
particular EC2 instance in your account will behave identically — that is what the
platform contract covers. Both together form the trust chain.

## Where the data lives

Everything the site renders comes from the published verification record
(`current.json` and its history) in public storage. The frontend never infers
status, release type or supported regions — it renders the record verbatim.
