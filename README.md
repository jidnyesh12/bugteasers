# CodeGuru AI (bugteasers)

An AI-assisted programming judge for classrooms: instructors generate and assign problems, students solve them in the browser, and every submission runs in a sandbox against seeded hidden tests.

Instructors create classrooms, build a problem bank (by hand or with Gemini), and hand out assignments with deadlines. Students write Python, Java, C or C++ in an in-browser editor, run their code against the sample cases, submit against hidden cases, and ask for up to three AI hints per problem. When an instructor closes an assignment, a background worker compares every submission with the others and with the reference solution and flags likely plagiarism.

The part that makes it more than a judge is test generation. Gemini writes a problem statement, a C++ reference solution and a set of typed input templates. A deterministic generator expands each template into many seeded inputs, the reference solution produces every hidden answer in a sandbox, and the model never writes a hidden expected output itself. The design is described in the paper *TestCase-DSL: Seeded Materialization and Two-Pass Oracle Validation for Scalable Programming-Test Generation* (see [Test-case generation](#test-case-generation)).

## Contents

- [Features](#features)
- [How it works](#how-it-works)
- [Test-case generation](#test-case-generation)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Testing](#testing)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Features

**For instructors**

- Classrooms with join codes, and a problem bank shared across assignments.
- AI problem generation: pick a topic, difficulty and tags, review the draft (statement, examples, hints, reference solution, test cases), edit it, and save it.
- Assignments with deadlines, assigned to one or more classrooms.
- Closing an assignment blocks new submissions and starts plagiarism analysis. Each student row then shows the highest similarity, whether it matches a classmate or the reference solution, editor telemetry (pastes, tab switches, active time) and the submitted code.

**For students**

- A CodeMirror editor with autocomplete for Python, Java, C and C++.
- **Run** checks the code against the sample cases; **Submit** grades it against every case, including hidden ones, and records the score.
- Verdicts name the failure: wrong answer, time limit exceeded, memory limit exceeded, output limit exceeded, runtime or compile error.
- Up to three AI hints per problem that build on each other and never contain code.
- Submission history per problem.

**Judging**

- Code runs in [Piston](https://github.com/engineer-man/piston), an isolated sandbox, with each problem's own time and memory limits (C and C++ get the limit as written, Java gets twice the time and 64 MB more memory, Python three times the time and 16 MB more).
- Test cases run concurrently, a compile error stops the run after the first case, and hidden inputs, outputs and runtime messages are never sent back to the student.

## How it works

```mermaid
flowchart LR
  browser[Browser] --> web[Next.js app<br/>apps/web]
  web --> db[(Supabase Postgres)]
  web -->|code + stdin| caddy[Caddy<br/>HTTPS + API key]
  caddy --> piston[Piston sandbox]
  web -->|problem drafts, hints| gemini[Google Gemini]
  web -->|START_ANALYSIS| mq[[RabbitMQ]]
  mq --> worker[Plagiarism worker<br/>apps/worker]
  worker --> db
```

| Piece | What it does |
| --- | --- |
| `apps/web` | Next.js 16 app: UI, API routes, auth (NextAuth credentials), problem generation, judging. Deploys to Vercel or as a container. |
| `apps/worker` | Long-running Node process. Consumes `START_ANALYSIS` messages, fingerprints submissions and writes plagiarism matches. |
| `packages/ast-core` | Parses code with tree-sitter (WASM grammars for C++, Java, Python and JavaScript), anonymizes identifiers, and builds winnowed k-gram fingerprints (k = 15, window = 40). |
| `packages/mq-core` | Thin RabbitMQ publish and consume helpers shared by the web app and the worker. |
| `infra/piston` | Piston image with the request size, output, time and stdin fixes this project needs (see [Deployment](#deployment)). |
| `infra/caddy` | Gateway that puts HTTPS and an API key in front of Piston and exposes only the execute and runtimes endpoints. |

Supabase is used as a hosted Postgres with an HTTP API. Authentication is NextAuth with bcrypt-hashed passwords in the `users` table, not Supabase Auth.

Problem generation runs as a job. The browser starts it and then polls `GET /api/problems/generate/:jobId`, and each poll advances the job one step (`queued` → `ai_generating` → `validating`, with `retrying` on recoverable failures), holding a lock so two polls never work on the same job.

## Test-case generation

The model is asked once per problem for a statement, a C++ reference program, two or three sample cases with their answers, and an input template for every test case. Templates are written in TestCase-DSL, a small JSON language:

```json
{
  "version": 1,
  "variables": {
    "n": { "type": "int", "min": 1, "max": 100000 },
    "arr": { "type": "int_array", "length": { "ref": "n" }, "min": -1000000000, "max": 1000000000 }
  },
  "output": [
    { "type": "line", "values": [{ "ref": "n" }] },
    { "type": "line", "values": [{ "ref": "arr" }] }
  ]
}
```

Variables can be `const`, `int`, `choice`, `string`, `int_array`, `matrix`, `permutation`, `pairs` or `graph`, and any number can refer to another variable. The checker rejects unknown references and cycles and evaluates variables in dependency order.

**Seeds.** The job seed is the SHA-256 of the request. Each test case gets `HMAC-SHA256(job seed, "problem-<p>|<i>")`, the template's own seed fragment is mixed in with SHA-256, and the result seeds an FNV-1a/xorshift32 generator. The same seed always produces the same bytes, so a case is stored as its template and seed, and the judge regenerates the input every time it runs.

**Two-pass validation.**

1. Pass 1 runs the reference on every sample case and compares its output with the answer the model wrote. A mismatch, crash, timeout or compile error sends only `solution_code` back to the model for repair (at most three attempts).
2. Pass 2 runs only after every sample agrees. Each hidden case's expected output is whatever the reference prints in the sandbox. Anything the model wrote there is replaced.

**Fan-out.** After Pass 2, each hidden template is expanded into more cases: it draws `TESTCASE_FANOUT_CANDIDATES` seeds, drops inputs that repeat an earlier one, orders the rest by size (largest, smallest, then evenly in between) and keeps up to `TESTCASE_FANOUT_KEEP` cases per template, skipping any input the reference fails on. Sandbox outages are reported as such and never sent to the repair loop.

**Limits.**

| Limit | Value |
| --- | --- |
| Elements in one collection | 200,000 (the prompt asks for at most `TESTCASE_MAX_COLLECTION_LENGTH`, default 100,000) |
| Generated stdin | 8 MiB |
| Reference output | 8 MiB, longer output fails validation instead of being cut |
| Reference run time | the problem's time limit, clamped to 0.5 to 10 s |
| Request body to Piston | 16 MB |
| Output shown in the UI and API | first 2,000 characters; verdicts always compare the full output |

## Getting started

### Requirements

- Node.js 24 (the version in `package.json` `engines`) and pnpm 10.34, which `corepack enable` installs from `packageManager`.
- Docker Desktop, or Docker Engine with Compose v2, for Piston, RabbitMQ and a local Supabase.
- A [Gemini API key](https://aistudio.google.com/apikey) for problem generation and hints. Everything else runs without it.
- About 6 GB of free RAM for the full local stack.

### 1. Install dependencies

```bash
corepack enable
pnpm install
```

### 2. Start the sandbox and the queue

```bash
docker compose up -d
```

This builds the Piston image, installs the C/C++ (gcc 10.2), Python 3.12 and Java 15 runtimes into a named volume on first start, and starts RabbitMQ. Piston listens on `127.0.0.1:2000` and RabbitMQ on `127.0.0.1:5672` (management UI on `:15672`, user `bugteasers`).

### 3. Start a database

Either run Supabase locally (from any folder outside the repository):

```bash
npx supabase init
```

```bash
npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

or create a free project at [supabase.com](https://supabase.com) and copy its API URL, keys and database connection string.

### 4. Apply the migrations

With `psql` installed:

```bash
sh infra/db/apply-migrations.sh postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Without it, run the same script in a Postgres container (on Linux add `--add-host=host.docker.internal:host-gateway`):

```bash
docker run --rm -v "$PWD:/repo" -w /repo postgres:17-alpine sh infra/db/apply-migrations.sh postgresql://postgres:postgres@host.docker.internal:54322/postgres
```

For a hosted project, pass its connection string instead. The migrations are meant for an empty database and run in filename order.

### 5. Configure the apps

```bash
cp apps/web/.env.example apps/web/.env
```

```bash
cp apps/worker/.env.example apps/worker/.env
```

The examples already point at the local stack. Set `NEXTAUTH_SECRET` (`openssl rand -base64 32`) and `GEMINI_API_KEY`. The web app reads `apps/web/.env`, not a `.env` at the repository root.

### 6. Run it

```bash
pnpm dev
```

This starts the web app on [http://localhost:3000](http://localhost:3000) and the worker. If the worker cannot reach Postgres or RabbitMQ it exits with an error and the web app keeps running.

### First steps in the app

1. Register an instructor at `/register?role=instructor`, create a classroom and note its join code.
2. Generate a problem under **Problems → Generate**, or create one by hand, and add it to an assignment for the classroom.
3. Register a student at `/register`, join the classroom with the code and solve the assignment.
4. Close the assignment as the instructor and open a student row to see the plagiarism result.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web app and worker together |
| `pnpm dev:web` | Web app only |
| `pnpm dev:worker` | Worker only |
| `pnpm build` | Production build of the web app |
| `pnpm lint` | ESLint |
| `pnpm type-check` | TypeScript, no emit |
| `pnpm test` | Vitest suite for the web app, then the ast-core checks |
| `docker compose up -d` | Piston, its runtimes and RabbitMQ for local development |

## Testing

```bash
pnpm test
```

The web app has 514 Vitest tests in 54 files (14,500 lines), including property-based tests with fast-check for the DSL, the Piston client and the execution service. They cover the template DSL, seed derivation and replay, fan-out and selection, the two-pass validator, the repair loop and job state machine, the Piston client's retries, limits and redaction of hidden results, and the API routes against a mocked Supabase. `packages/ast-core` has its own fingerprinting checks.

To run one file:

```bash
pnpm --filter @bugteasers/web exec vitest run test/ai/generation-validation.unit.test.ts
```

CI (`.github/workflows/ci.yml`) runs lint, type-check, tests and the production build on every pull request, and builds the Piston, worker and web images.

## Configuration

**`apps/web/.env`**

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXTAUTH_URL` | yes | Public URL of the app |
| `NEXTAUTH_SECRET` | yes | Session signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side database access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser access for editor telemetry |
| `PISTON_API_URL` | yes | Piston, or the Caddy gateway in front of it |
| `PISTON_API_KEY` | with Caddy | Sent as `Authorization: Bearer <key>` |
| `GEMINI_API_KEY` | for AI features | Problem generation and hints |
| `RABBITMQ_URL` | for plagiarism | Broker the worker listens on |
| `PISTON_MAX_CONCURRENCY` | no (4) | Sandbox runs at once per request |
| `TESTCASE_FANOUT_CANDIDATES` | no (8) | Seeds tried per hidden template |
| `TESTCASE_FANOUT_KEEP` | no (3) | Hidden cases kept per template, including the original |
| `TESTCASE_MAX_COLLECTION_LENGTH` | no (100000) | Largest collection the prompt asks for |

**`apps/worker/.env`**: `DATABASE_URL` (direct Postgres connection) and `RABBITMQ_URL`.

**`.env` next to `docker-compose.yml`** (servers only): `RABBITMQ_USER`, `RABBITMQ_PASSWORD`, `COMPOSE_RABBITMQ_URL`, `PISTON_DOMAIN`, `PISTON_API_KEY`, and the two `NEXT_PUBLIC_SUPABASE_*` values used to build the web image. See `.env.example`.

## Deployment

Piston needs a privileged Docker container and the worker is a long-running process, so neither can run on Vercel. The production shape is the web app on Vercel and one small Linux VM for everything else.

### Vercel and one VM

**Database.** Create a Supabase project and apply the migrations with its connection string (step 4 above).

**Queue.** The web app on Vercel has to reach RabbitMQ. The simplest option is a hosted broker such as CloudAMQP's free plan: use its `amqps://` URL as `RABBITMQ_URL` in Vercel and as `COMPOSE_RABBITMQ_URL` on the VM.

**VM.** Any Linux host with Docker works, for example an EC2 `t3.small` (2 GB) running Ubuntu 24.04. With 1 GB set `PISTON_MAX_CONCURRENCY=2` or compiles can run out of memory.

1. Point a DNS record such as `piston.example.com` at the VM.
2. Open ports 80 and 443 (Caddy) and 22 (SSH) in the security group. Do not open 2000 or 5672.
3. Install Docker, clone the repository and create the settings files:

   ```bash
   cp .env.example .env
   ```

   ```bash
   cp apps/worker/.env.example apps/worker/.env
   ```

   In `.env` set `PISTON_DOMAIN`, a `PISTON_API_KEY` of at least 32 characters (`openssl rand -hex 32`), `RABBITMQ_USER`, `RABBITMQ_PASSWORD` and `COMPOSE_RABBITMQ_URL`. In `apps/worker/.env` set `DATABASE_URL` to the Supabase connection string.

4. Start Piston behind Caddy, and the worker:

   ```bash
   docker compose --profile server --profile worker up -d --build
   ```

   Caddy obtains a TLS certificate for `PISTON_DOMAIN`, refuses to start without a key, and answers 401 to any request without it or for any path other than `/api/v2/execute` and `/api/v2/runtimes`.

**Vercel.**

1. Import the repository with **Root Directory** `apps/web`. Node 24 comes from `engines`.
2. Add the variables from `apps/web/.env.example`, with `PISTON_API_URL=https://piston.example.com` and the same `PISTON_API_KEY`.
3. Set the function region close to the Supabase project and the VM. Every test case is one round trip to Piston.
4. Keep Fluid compute on. Generation, run, submit and hint routes allow up to 300 seconds, the Hobby plan's maximum.

Vercel limits request and response bodies to 4.5 MB. The app keeps large test data on the server (hidden inputs are regenerated from their seeds, and only the first 2,000 characters of long outputs are sent to the browser), so problems with 100,000-element inputs stay within that limit.

### Everything on one VM

Add the web profile, put the web app's variables in `apps/web/.env`, and pass the two `NEXT_PUBLIC_SUPABASE_*` values in `.env`, since Next.js builds them into the image:

```bash
docker compose --profile server --profile worker --profile web up -d --build
```

The web container listens on `127.0.0.1:3000`. To serve it over HTTPS, add a site to `infra/caddy/Caddyfile`:

```caddyfile
app.example.com {
	reverse_proxy web:3000
}
```

### Updating

```bash
git pull
```

```bash
docker compose --profile server --profile worker up -d --build
```

## Project structure

```text
apps/
  web/                      Next.js app
    app/                    Pages and API routes (App Router)
    components/             Shared React components
    database/migrations/    SQL migrations, applied in filename order
    lib/
      ai/                   Gemini generation, generation jobs, hints, oracle validation
        template-dsl/       TestCase-DSL: types, checker, seeded materializer
      execution/            Piston client, judging service, limits, access checks
      submissions/          Submission history and plagiarism views
    test/                   Vitest suites
  worker/                   Plagiarism worker
packages/
  ast-core/                 tree-sitter fingerprinting and similarity
  mq-core/                  RabbitMQ helpers
infra/
  piston/                   Piston image and runtime installer
  caddy/                    Gateway in front of Piston
  db/                       Migration runner
docker-compose.yml          Local services, and server profiles for deployment
```

## Troubleshooting

**The app starts but every page that needs data fails.** The web app only reads `apps/web/.env`. A `.env` at the repository root is ignored by Next.js.

**Runs fail with `PayloadTooLargeError` or large inputs give wrong answers.** That is stock Piston: it rejects requests over 100 KB, cuts stdout at 1 KB, caps runs at 3 seconds and drops stdin beyond a few hundred KB. Use the image in `infra/piston`, which fixes all four. The public `emkc.org` Piston only accepts allow-listed clients and cannot be used.

**Generation or hints fail immediately.** Check `GEMINI_API_KEY`. Without a valid key everything except AI features still works.

**`pnpm dev` shows `DATABASE_URL environment variable is not set`.** That is the worker. Create `apps/worker/.env`, or run `pnpm dev:web` to start only the web app.

**Problem generation says the sandbox is unavailable.** Piston is down or unreachable. Check `docker compose ps` and `PISTON_API_URL`; outages are retried and are never treated as a bug in the reference solution.

## Known limitations

- Each test case compiles the program again, because Piston has no compile-once mode. Cases run concurrently, but a sandbox that compiles once and runs many inputs would cut submit time most.
- Generation steps run inside the polling request, so one step (validation plus up to three repair calls to Gemini) has to finish within the function time limit.
- If the statement, the samples and the reference solution share the same misunderstanding, Pass 1 agrees and Pass 2 produces a consistent but wrong suite. Instructors should review generated problems.
- Anyone can register as an instructor, and the browser writes editor telemetry directly with the anon key. Both need row-level security or an approval step before a public launch.
- Node.js 26 becomes LTS on 28 October 2026. Move `engines` and the Docker images to it once Vercel offers it.

## Contributing

Issues and pull requests are welcome. Before opening a pull request, run `pnpm lint`, `pnpm type-check` and `pnpm test`; CI runs the same checks plus the build and the Docker images. Change dependencies only through pnpm (`pnpm add`, `pnpm update`), and keep commit subjects in the `type(scope): description` form used in the history.

## Maintainers

- Aditya Kotkar ([@adityakotkar47](https://github.com/adityakotkar47))
- Jidnyesh Suryawanshi ([@jidnyesh12](https://github.com/jidnyesh12))
- Shivam Hippalgave ([@KingShivamX](https://github.com/KingShivamX))
- Sakshi Deshmukh ([@deshmukh-sakshi](https://github.com/deshmukh-sakshi))

## Acknowledgements

Built at the Department of Computer Engineering, MIT Academy of Engineering, Pune, under the guidance of Dr. Pramod Ganjewar. Code execution uses [Piston](https://github.com/engineer-man/piston) and parsing uses [tree-sitter](https://tree-sitter.github.io/).

## License

[MIT](LICENSE) © 2026 Aditya Kotkar, Jidnyesh Suryawanshi, Shivam Hippalgave and Sakshi Deshmukh.
