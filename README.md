# 🚀 VibeCodeStack

> The ultimate template for rapid, modern web development optimized for Claude Code with Swiss Army Knife dev tools.

## ✨ What's Inside

- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React 18** + **TypeScript** - Modern React with full type safety  
- 🎨 **Tailwind CSS** - Utility-first styling for rapid UI development
- 📱 **PWA Ready** - Offline-first with service workers
- 🧪 **Vitest** - Fast unit testing
- 🔍 **ESLint + Prettier** - Code quality and formatting
- 🛠️ **clsx + tailwind-merge** - Smart className utilities

## 🚀 Quick Start

```bash
# 1. Install dev tools (one-time setup)
brew install pnpm bat eza fd ripgrep fzf tree jq git-delta && npm install -g sharp-cli typescript vite

# 2. Use this template
gh repo create my-project --template rgbk/VibeCodeStack
cd my-project

# 3. Install dependencies (using pnpm for speed)
pnpm install

# 4. Start development
pnpm dev
```

## 📝 Available Scripts

```bash
pnpm dev             # Start dev server
pnpm build           # Production build
pnpm preview         # Preview production build
pnpm lint            # Check code quality
pnpm lint:fix        # Fix linting issues
pnpm format          # Format code with Prettier
pnpm test            # Run tests
pnpm test:ui         # Run tests with UI
pnpm type-check      # TypeScript type checking
```

## 🛠️ Claude Code Optimized Dev Tools

This template includes a complete Swiss Army Knife setup for maximum productivity:

### Modern CLI Tools
- **pnpm** - Faster package manager than npm
- **bat** - Better `cat` with syntax highlighting
- **eza** - Better `ls` with colors and icons  
- **rg** (ripgrep) - Lightning fast search
- **fzf** - Fuzzy finder for everything
- **fd** - Better `find` command
- **jq** - JSON processor
- **tree** - Directory tree viewer
- **git-delta** - Beautiful git diffs

### Global Development Tools
- **sharp-cli** - Image processing
- **typescript** - Global TypeScript compiler
- **vite** - Global Vite for quick prototyping

## 🏗️ Project Structure

```
src/
├── components/      # Reusable UI components
├── hooks/          # Custom React hooks  
├── lib/            # Utility functions
├── pages/          # Page components
└── styles/         # Global styles
```

## 🎯 Best Practices Included

- **Type Safety** - Full TypeScript setup
- **Code Quality** - ESLint with React-specific rules
- **Formatting** - Prettier with Tailwind plugin
- **Testing** - Vitest configured and ready
- **PWA** - Service worker and manifest configured
- **Performance** - Optimized build configuration

Built with ❤️ for rapid development