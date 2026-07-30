# One Piece Stack

Production-ready SaaS Starter Kit with emphasis on Security and Scale so YOU can focus on your product and customers
(inspired by Epic Stack)

## What's in the box (well, stack)

- Built with [React Router](https://reactrouter.com/)
- Written in [TypeScript](https://typescriptlang.org)
- Primary Database of Choice - [PostgreSQL](https://postgresql.org)
- Secondary Database(optional) - [Redis](https://redis.io)
- Lightweight, performant server framework - [Hono](https://hono.dev)
- ORM - [Prisma v7](https://prisma.io)
- Send Transactional emails with [Resend](https://resend.com/) or [AWS SES](https://aws.amazon.com/ses/)
- Storing Assets in [Cloudflare R2](https://developers.cloudflare.com/r2/) (can easily be swapped out to AWS S3)
- Styling with [TailwindCSS](https://tailwindcss.com)
- Component Library - [ShadCN UI](https://ui.shadcn.com/)
- Deploys anywhere with [Docker](https://docker.com)
- Ultra Fast Code formatting and linting with [Biome](https://biomejs.dev/) and [Oxlint](https://oxc.rs)
- Git hooks for code quality - [Husky](https://typicode.github.io/husky/)
- Payment and Subscriptions with [Dodo Payments](https://dodopayments.com/)
- Error Tracking with [Sentry](https://sentry.io)
- Analytics - [Plausible](https://plausible.io)
- Domain, DDos Protection and CDN with [Cloudflare](https://www.cloudflare.com/)
- Async Processing *(Crons, Queues, AI Agent Workflows)* - [Inngest](https://inngest.com)

## Features

- Email/Password Auth with Email OTP, Google/Twitter Providers and Admin Dashboard with User Management.
- Customizable Copy Writing Components and Pages like Privacy Policy, Terms of Service, Cookie Policy, Testimonials, Product Demo, Pricing, FAQ etc.
- Health check route
- Dark Mode Support
- CSRF Protection and Honeypot
- Caching and Rate-Limiting

## Service Configuration

One Piece Stack integrates with several external services for storage, payments, monitoring, analytics and background processing. Most integrations only require creating an account and adding the appropriate credentials to your `.env` file.

### Object Storage — Cloudflare R2

[Cloudflare R2](https://developers.cloudflare.com/r2/) is the default object storage provider for storing uploaded files and other application assets.

R2 implements an S3-compatible API, allowing the application to use the AWS S3 SDK while storing files in Cloudflare R2.

Create an R2 bucket and generate API credentials:

* [Cloudflare — Get Started with R2](https://developers.cloudflare.com/r2/get-started/)
* [Cloudflare — R2 API Tokens](https://developers.cloudflare.com/r2/api/tokens/)
* [Cloudflare — S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)


Because the storage implementation uses the S3 API, Cloudflare R2 can be replaced with AWS S3 or another S3-compatible storage provider with minimal changes.

### Email — Resned

We use Resend to send all kinds of emails by default. You can choose your email provider using the `EMAIL_PROVIDER` environment variable:

Before sending emails with resend, you'll need to add and verify your sending domain with Resend by configuring the required DNS records.

Official setup guides:

* [Resend — Managing Domains](https://resend.com/docs/dashboard/domains/introduction)
* [Resend — API Keys](https://resend.com/docs/dashboard/api-keys/introduction)
* [Resend — Documentation](https://resend.com/docs/introduction)

Once your domain is verified, make sure `EMAIL_FROM` uses an address from your verified domain.

#### Using AWS SES

To use AWS SES instead, simply change the email provider:

```sh
EMAIL_PROVIDER=ses
EMAIL_FROM=noreply@yourdomain.com
```

AWS SES uses the AWS credentials already configured in your `.env`:

```sh
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
```
The rest of the application uses the same email interface regardless of the selected provider.

Before sending emails, you'll need to configure Amazon SES and verify the domain or email address used by `EMAIL_FROM`.

Official setup guides:

* [AWS — Getting Started with Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/getting-started.html)
* [AWS — Creating and Verifying Identities](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html)

New AWS SES accounts start in the **SES sandbox**. While your account is in the sandbox, you can only send emails to verified recipients and are subject to lower sending limits. Request production access from AWS before using SES for production email delivery.

Once your SES account and sending identity are configured, no application code needs to be changed.

### Payments — Dodo Payments

[Dodo Payments](https://dodopayments.com/) is used for payments and subscription management.

Create your account, configure your products, and add your API and webhook credentials to `.env`:

Setup and integration guides:

* [Dodo Payments — Documentation](https://docs.dodopayments.com/)
* [Dodo Payments — API Reference](https://docs.dodopayments.com/api-reference/introduction)
* [Dodo Payments — Webhooks](https://docs.dodopayments.com/developer-resources/webhooks/introduction)

Make sure your webhook endpoint and webhook secret are correctly configured before accepting production payments.

### Authentication — Google OAuth

Email/password authentication works without an external OAuth provider. Google authentication requires creating OAuth credentials in Google Cloud.

Setup guides:

* [Google — OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
* [Google Cloud — Create OAuth Credentials](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)

Make sure the authorized redirect URI configured in Google Cloud matches the callback URL used by your application.

### Error Tracking — Sentry

[Sentry](https://sentry.io/) provides production error tracking and application monitoring.

Create a Sentry project and add its DSN to our `.env` file:

Setup guides:

* [Sentry — JavaScript Documentation](https://docs.sentry.io/platforms/javascript/)
* [Sentry — React Router](https://docs.sentry.io/platforms/javascript/guides/react-router/)

### Analytics — Plausible

[Plausible](https://plausible.io/) provides lightweight, privacy-friendly *open-source* web analytics without adding a large analytics SDK to your application.

Add your website to Plausible and configure the application with your domain.

Setup guides:

* [Plausible — Getting Started](https://plausible.io/docs/plausible-script)
* [Plausible — Documentation](https://plausible.io/docs)

### Background Jobs & Workflows — Inngest

[Inngest](https://www.inngest.com/) handles asynchronous and durable background processing.

The stack uses it for workloads such as:

* Transactional email processing
* Scheduled jobs and cron tasks
* Background queues
* Long-running workflows
* AI agent workflows

Setup guides:

* [Inngest — Getting Started](https://www.inngest.com/docs/getting-started)
* [Inngest — Functions](https://www.inngest.com/docs/features/inngest-functions)
* [Inngest — Scheduled Functions](https://www.inngest.com/docs/guides/scheduled-functions)

For local development, run the Inngest Dev Server alongside your application when working with background functions.

### Database — PostgreSQL

[PostgreSQL](https://www.postgresql.org/) is the primary database, with [Prisma](https://www.prisma.io/) providing the ORM and database tooling.


Useful documentation:

* [PostgreSQL — Documentation](https://www.postgresql.org/docs/)
* [Prisma — PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql)
* [Prisma — Migrations](https://www.prisma.io/docs/orm/prisma-migrate)

A local PostgreSQL instance is included in the Docker Compose development setup.

### Caching & Rate Limiting — Redis

[Redis](https://redis.io/) is an optional secondary datastore used for caching and rate limiting.

The application can run without Redis when features depending on it are not enabled.

### Domain, DNS & CDN — Cloudflare

[Cloudflare](https://www.cloudflare.com/) is recommended for DNS management, CDN, TLS, and DDoS protection.

Setup guides:

* [Cloudflare — Get Started](https://developers.cloudflare.com/fundamentals/get-started/)
* [Cloudflare — DNS](https://developers.cloudflare.com/dns/)
* [Cloudflare — SSL/TLS](https://developers.cloudflare.com/ssl/)
* [Cloudflare — DDoS Protection](https://developers.cloudflare.com/ddos-protection/)


## Development

Create a new project

```sh
npx create-one-piece-app
```

or

```sh
pnpm create one-piece-app
```

Replace .env.example with .env and fill in the values.

Start Local Database:

```sh
docker-compose up -d
```

Generate Prisma Client Types and Seed the Database:

```sh
pnpm run db:generate

pnpm run db:seed
```

Start dev server:

```sh
pnpm dev
```

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# For pnpm
docker build -f Dockerfile -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

#### Other Available Scripts

- `pnpm check`: Run Oxlint
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
- `pnpm db:seed`: Seeding the Database

## Deployment

The containerized application of the One Piece Stack can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `pnpm typecheck`.

### Linting

This project uses Oxlint for linting. That is configured in `.oxlintrc.json`.

### Formatting

We use [Biome](https://biomejs.dev/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Biome Plugin](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) to get auto-formatting on save.

<hr />

## Guidelines for Copywriting

The included marketing components are designed to help turn a new product into a clear, credible landing page without requiring you to start from scratch.

Treat the default copy as a framework. Replace examples, claims, metrics, screenshots, testimonials, and social proof with information that accurately represents your product.

### Call to Action (CTA)

Every primary CTA should clearly communicate what the user gets by taking the next step.

A CTA card should include:

1. **Headline** — A short, compelling reason to take action.
2. **Supporting copy** — Explain the immediate benefit or outcome.
3. **Action-oriented button** — Prefer specific outcomes such as "Create your first invoice", "Start your 7-day trial", or "Save on processing fees" over generic labels like "Submit".
4. **Social proof** — When available, show a real and verifiable signal such as customers served, GitHub stars, reviews, testimonials, or community members.
5. **Destination** — Link directly to the most relevant signup, onboarding, checkout, or dashboard page.

Keep the CTA focused on one primary action. Avoid competing buttons unless there is a meaningful secondary path.

### Why This Product?

Answer the question every potential customer has:

> Why should I use this instead of what I already have?

This section should establish:

1. **The problem** — Clearly describe the problem your target customer experiences.
2. **The cost of the problem** — Explain why it matters in terms of time, money, complexity, risk, or lost opportunity.
3. **Existing alternatives** — Explain how people solve the problem today and where those approaches fall short.
4. **Your advantage** — Show specifically how your product provides a better outcome.

This can be presented as a problem-versus-solution comparison, a concise feature/benefit list, or a visual comparison with existing alternatives.

Avoid vague claims such as "10x better" unless you can substantiate them.

### Product Demo

Show users how the product works instead of relying entirely on descriptive copy.

For multi-step workflows, use an interactive step-by-step component where selecting a step updates the accompanying product preview.

For example:

1. Create an invoice
2. Add a customer
3. Send the invoice
4. Receive payment

The corresponding UI preview should update as the user moves through each step.

Use real product screenshots whenever possible. The goal is to help a visitor understand the core workflow before creating an account.

### Value Proposition

Your value proposition should communicate the outcome of using the product, not simply list its features.

Prefer:

> Get invoices paid without manually following up with every customer.

Over:

> Automated invoice reminder system.

Use visual components where they make the benefit easier to understand, including:

* Before-and-after workflows
* Problem → Solution diagrams
* Interactive product previews
* Real product screenshots
* Comparisons with existing workflows

Where appropriate, support the problem with credible external evidence such as public discussions, industry research, customer interviews, reviews, or published articles.

Never fabricate testimonials, customer counts, reviews, screenshots, tweets, Reddit posts, or other forms of social proof.

### Social Proof

Use social proof to reduce uncertainty, not simply to decorate the page.

Good sources include:

* Customer testimonials
* Verified reviews
* GitHub stars and contributors
* Public community discussions
* Usage statistics
* Case studies
* Customer logos, when you have permission to display them

Prefer specific evidence over generic claims.

### Pricing

Avoid defaulting to a permanently free plan unless it is an intentional part of the product's growth strategy.

For paid SaaS products, consider:

* Free credits
* Usage allowances
* Time-limited trials such as 7 or 14 days
* Money-back guarantees where appropriate
* Paid plans aligned with customer value

Price according to the problem being solved and the value delivered.

A **painkiller** solves an urgent, expensive, or recurring problem and can generally support stronger pricing.

A **vitamin** provides incremental improvement or convenience and usually needs a lower-friction price or stronger habit-forming value.

Pricing should ultimately be validated with real customers rather than determined solely from competitor pricing.

### Design & Motion

Keep the interface focused.

Do not add animations simply because they look impressive in isolation. Motion should help communicate state, hierarchy, navigation, or product behavior.

Prefer:

* Fast page loads
* Clear typography
* Strong information hierarchy
* Responsive layouts
* Accessible interactions
* Subtle transitions
* Dark mode when appropriate

Avoid unnecessary animations, oversized effects, and visual elements that distract from understanding the product.

**Minimal by default. Add complexity only when it improves the experience.**

