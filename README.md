# One Piece Stack

Production Ready SAAS Starter Kit with emphasis on Security and Scale so YOU can focus on your product and customers
(inspired by Epic Stack)

## What's in the box (well, stack)

- Built with [React Rouer](https://reactrouter.com/)
- Written in [TypeScript](https://typescriptlang.org)
- Primary Database of Choice - [PostgreSQL](https://postgresql.org)
- Secondary Database(optional) - [Redis](https://redis.io)
- Lightweight, performant server framework - [Hono](https://hono.dev)
- ORM - [Prisma v7](https://prisma.io)
- Send Transactional emails with [AWS SES](https://aws.amazon.com/ses/)
- Storing Assets in [Cloudflare R2](https://developers.cloudflare.com/r2/)
- Styling with [TailwindCSS](https://tailwindcss.com)
- Component Library - [ShadCN UI](https://ui.shadcn.com/)
- Deploys anywhere with [Docker](https://docker.com)
- Ultra Fast Code formatting and linting with [Biome](https://biomejs.dev/) and [Oxlint](https://oxc.rs)
- Git hooks for code quality - [Husky](https://typicode.github.io/husky/)
- Payment and Subscriptions with [Dodo Payments](https://dodopayments.com/)
- Error Tracking with [Sentry](https://sentry.io)
- Analytics - [Plausible](https://plausible.io)
- Domain, DDOS Protection and CDN with [Cloudflare](https://www.cloudflare.com/)
- Async Processing *(Crons, Queues, AI Agent Workflows)* - [Inngest](https://inngest.com)

## Features

- Email/Password Auth with Email OTP, Google/Twitter Providers and Admin Dashboard with User Management.
- Customizable Copy Writing Components and Pages like Privacy Policy, Terms of Service, Cookie Policy, Testimonials, Product Demo, Pricing, FAQ etc.
- Health check route
- Dark Mode Support
- CSRF Protection and Honeypot
- Caching and Rate-Limiting

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

## Guidelines for Copy Writing

- **CTA**: Every Call to action should be a card-like component consisting of:
  1. A strong Subject line to grab the user's attention
  1. Subtitle to explain the benefits of using the product
  1. Button text which sparks powerful emotion, like "join 1000s of people", "save money" etc.
  1. A socially relevant "lovedBy" number which shows how many people love the product, it can be GitHub stars, testimonials, Twitter replies etc.
  1. A link to the product's dashboard page

- **Why this:** Why would the customer want to use this product?
  1. It should explain that the problem is real and people can pay for the solution
  2. It should compare what the currently available solutions aren't solving for and what your product does better than the competition
  3. The component can be two lists of problems and solutions Or a single-line bulleted list featuring the best of the product

- **Demo steps:** Give interactive Definition list type components so that when a user clicks on a step, it expands and shows the next step while side by side it shows the UI of the app navigation structure so he knows if he clicks on "generate invoice", he will see the UI of the invoice generation page

- **Value Prop:** What is the value proposition of the product?
  1. A Visual Interactive image-type component which shows the problem and solution in linked cards
  1. Give screenshots of people's tweets, Reddit posts, other forums, or blog articles on how a certain problem is expensive and a solution is needed.

- **Pricing:** NO Free Plans. Only give free credits or 7-day trials. Price accordingly if the product is a _Vitamin_ or _Painkiller_

- **NO Fancy animations maybe Dark mode:** If not necessary, don't ship, minimal is best
