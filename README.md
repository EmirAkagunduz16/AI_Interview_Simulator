# 🏋️ AI-Coach

A modern full-stack application built with a monorepo architecture, combining a Next.js frontend with NestJS microservices backend.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Architecture](#architecture)

## 🎯 Overview

AI-Coach is a full-stack application built with cutting-edge technologies, leveraging Turborepo for efficient monorepo management. The project consists of a Next.js web application and a NestJS microservices backend, sharing common packages and configurations.

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **TypeScript** - Type safety

### Backend
- **[NestJS 11](https://nestjs.com/)** - Progressive Node.js framework
- **Express** - HTTP server

### Monorepo Management
- **[Turborepo](https://turbo.build/repo)** - High-performance build system
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

### Code Quality
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting

## 📁 Project Structure

```
AI-Coach/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── app/               # Next.js App Router pages
│   │   ├── public/            # Static assets
│   │   └── package.json
│   │
│   └── microservices/         # NestJS backend services
│       ├── src/               # Source code
│       └── package.json
│
├── packages/
│   ├── ui/                    # Shared React components library
│   ├── eslint-config/         # Shared ESLint configurations
│   └── typescript-config/     # Shared TypeScript configurations
│
├── package.json               # Root package.json
├── turbo.json                # Turborepo configuration
└── pnpm-workspace.yaml       # pnpm workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** 9.0.0 (will be automatically used via packageManager field)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI-Coach
```

2. Install dependencies:
```bash
pnpm install
```

## 📜 Available Scripts

Run these commands from the root directory:

### Development
```bash
# Start all applications in development mode
pnpm dev

# Start specific app
pnpm --filter web dev
pnpm --filter microservices dev
```

### Build
```bash
# Build all applications
pnpm build

# Build specific app
pnpm --filter web build
pnpm --filter microservices build
```

### Code Quality
```bash
# Lint all packages
pnpm lint

# Format code with Prettier
pnpm format

# Type check all packages
pnpm check-types
```

## 💻 Development

### Running the Full Stack

Start both the web app and microservices simultaneously:

```bash
pnpm dev
```

This will start:
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Microservices**: [http://localhost:3001](http://localhost:3001) (default NestJS port)

### Working with Individual Apps

**Web Application (Next.js)**
```bash
cd apps/web
pnpm dev          # Start dev server
pnpm build        # Create production build
pnpm start        # Start production server
```

**Microservices (NestJS)**
```bash
cd apps/microservices
pnpm dev          # Start with watch mode
pnpm start:debug  # Start with debugging
pnpm start:prod   # Start production build
pnpm test         # Run tests
```

## 🏗️ Building for Production

Build all applications:

```bash
pnpm build
```

The build artifacts will be:
- **Web**: `.next/` directory in `apps/web/`
- **Microservices**: `dist/` directory in `apps/microservices/`

### Production Deployment

**Web Application**
```bash
cd apps/web
pnpm build
pnpm start  # Starts production server
```

**Microservices**
```bash
cd apps/microservices
pnpm build
pnpm start:prod  # Runs production build
```

## 🏛️ Architecture

### Monorepo Benefits

- **Code Sharing**: Share common components, utilities, and configurations across apps
- **Atomic Changes**: Make changes across multiple packages in a single commit
- **Unified Versioning**: Manage dependencies consistently across the workspace
- **Faster Builds**: Turborepo caches build outputs and parallelizes tasks

### Shared Packages

**@repo/ui**
- Shared React component library
- Used by web application
- Built with TypeScript

**@repo/eslint-config**
- Centralized ESLint configurations
- Includes Next.js and Prettier configs
- Ensures consistent code style

**@repo/typescript-config**
- Shared TypeScript configurations
- Base configs for different project types
- Maintains type safety standards

### Turborepo Features

This project leverages Turborepo's powerful features:

- **Smart Caching**: Only rebuilds what changed
- **Parallel Execution**: Runs tasks concurrently for speed
- **Task Dependencies**: Automatically determines build order
- **Remote Caching**: Share cache across team (when configured)

## 📦 Adding New Packages

To add a new shared package:

1. Create a new directory in `packages/`
2. Add a `package.json` with a name starting with `@repo/`
3. Reference it in other packages using `workspace:*`
4. Run `pnpm install` to link the workspace dependency

Example:
```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license.

## 🔗 Useful Links

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [pnpm Documentation](https://pnpm.io)

---

Built with ❤️ using Turborepo
