# One Piece App CLI

A command-line tool to create a new app from the [One Piece Stack](https://github.com/aadi-thedevguy/one-piece-stack) starter template.

## Usage

Run the CLI with npm, Yarn, pnpm, or Bun:

```sh
npx one-piece-app [project-name]
yarn dlx one-piece-app [project-name]
pnpm dlx one-piece-app [project-name]
bunx one-piece-app [project-name]
```

If no name is provided, the CLI creates `one-piece-app` in the current directory. To choose a package manager explicitly, use `--package-manager` (or `--pm`):

```sh
npx one-piece-app my-app --package-manager bun
```

The CLI detects the package manager used to run it and installs dependencies with that manager. For npm, it uses `--legacy-peer-deps` to accommodate a peer dependency conflict in the current starter template. If you pass `--skip-install`, use `npm install --legacy-peer-deps` for npm, or your chosen manager's normal `install` command.

## Example

```sh
npx one-piece-app my-app
cd my-app
npm run dev
```

Use the equivalent `dev` command for your package manager (`yarn dev`, `pnpm dev`, or `bun run dev`). See the [One Piece Stack README](https://github.com/aadi-thedevguy/one-piece-stack#readme) for configuration and setup instructions.

## Requirements

- Node.js 18 or newer
- GitHub access to download the starter template

## License

ISC
