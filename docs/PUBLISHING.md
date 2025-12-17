# Publishing Guide

## Quick Start

```bash
# Local
npm run publish:dry  # test first
npm run publish      # publish (handles auth automatically)

# CI/CD
npm version patch && git push --tags
```

---

## Prerequisites

Update version in `package.json` following [semantic versioning](https://semver.org/).

> The publish script automatically runs build, lint, and test. You only need to run these manually for debugging.

---

## Local Publishing

**Step 1: Test with Dry-run**

```bash
npm run publish:dry
```

This will:
- ✓ Check authentication
- ✓ Show what would be built, linted, tested, and published
- ✗ Not actually publish to npm

**Step 2: Publish**

```bash
npm run publish
```

The script will:
1. **Check authentication** - If not logged in, it will prompt you to choose:
   - **Interactive Login** (persists across sessions): Runs `npm login` for you
   - **Environment Variable** (for automation): Set `NPM_TOKEN=your_token_here`
2. Build the package
3. Run linter
4. Run tests
5. Publish to npm with `--access public`

---

## CI/CD Publishing

Publishing is automated via GitHub Actions on version tags.

**Step 1: Update Version**

```bash
npm version patch  # bug fixes
npm version minor  # new features
npm version major  # breaking changes
```

**Step 2: Push Tag**

```bash
git push origin main --tags
```

**Step 3: Monitor**

[View workflow runs →](https://github.com/dunika/try-result/actions)

---

## Troubleshooting

### Authentication Failed

**Local:**
- Check: `npm whoami`
- Login: `npm login`
- Or set: `NPM_TOKEN` environment variable

**CI:**
- Set `NPM_TOKEN` secret in: Repository → Settings → Secrets and variables → Actions

### Build/Lint/Test Failures

```bash
npm run build
npm run lint
npm run test
```

### Version Already Published

- Update version in `package.json`
- Check published versions: [npmjs.com/package/try-result](https://www.npmjs.com/package/try-result)

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run publish` | Full publish pipeline (auth → build → lint → test → publish) |
| `npm run publish:dry` | Dry-run mode (test without publishing) |
| `npm run build` | Build the package only |
| `npm run lint` | Run linter only |
| `npm run test` | Run tests only |

## Checklist

- [ ] Version updated
- [ ] CHANGELOG updated (if applicable)
- [ ] README updated (if applicable)
- [ ] Dry-run successful
- [ ] Ready to publish
