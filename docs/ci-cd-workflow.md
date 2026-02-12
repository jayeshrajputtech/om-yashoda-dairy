# CI/CD Workflows & Release Guide

This document explains the Continuous Integration (CI) and Continuous Deployment (CD) workflows for the OM Yashoda Dairy application, and how to manage releases.

---

## 🔄 Overview

We use **GitHub Actions** to automate our testing and deployment processes.

| Workflow | File | Triggers | Purpose |
|----------|------|----------|---------|
| **CI** | `.github/workflows/ci.yml` | Push to `develop`<br>PR to `main`, `develop` | Linting, Testing, Security Scans, Preview Deploys |
| **CD** | `.github/workflows/deploy.yml` | Push to `main`, `develop` | Deploy to Production/Staging, Create Releases |
| **Sync** | `.github/workflows/sync-products.yml` | Change in `data/products.json` | Syncs product data to Firestore |

---

## 🛠 CI - Continuous Integration (`ci.yml`)

The CI workflow ensures code quality and security before merging.

### Triggers
- **Push**: To `develop` branch
- **Pull Request**: To `main` or `develop` branches

### Jobs
1. **Lint and Test**:
   - Checks code style (ESLint)
   - Checks formatting (Prettier)
   - verification build (`npm run build`)
   - Runs unit tests (if any)

2. **Security Scan**:
   - Runs `npm audit` to check for vulnerable dependencies

3. **Preview Deployment** (PR only):
   - Deploys a temporary preview instance to Vercel
   - Comments on the PR with the preview URL
   - Allows testing changes in a live-like environment before merging

---

## 🚀 CD - Continuous Deployment (`deploy.yml`)

The CD workflow handles deploying the application to Vercel.

### Triggers
- **Push**: To `main` or `develop` branches
- **Manual**: Via "Run workflow" button in GitHub Actions

### Process
1. **Checkout & Install**: Gets the latest code and installs dependencies.
2. **Deploy**:
   - Uses Vercel CLI to deploy.
   - **`develop` branch**: Deploys to a preview/staging URL (automatically handled by Vercel for non-production branches).
   - **`main` branch**: Deploys to Production.
3. **Release** (on `main` push):
   - Creates a GitHub Release automatically based on the version in `package.json`.
   - Tags the commit with `vX.X.X`.

---

## 📦 Release Strategy

### Branching Strategy
- **`develop`**: The integration branch. All feature branches merge here. Deploys to Staging.
- **`main`**: The production branch. Only stable code from `develop` is merged here. Deploys to Production.

### How to Release a New Version

To release a new version of the application (e.g., v1.1.0):

1. **Update Version**:
   - Update the version number in `package.json`.
   - You can do this manually or run:
     ```bash
     npm version minor # or patch, major
     ```
   - This creates a commit with the new version.

2. **Merge to Main**:
   - Create a Pull Request from `develop` to `main`.
   - Merge the PR.

3. **Automatic Deployment**:
   - The merge to `main` triggers the **CD** workflow.
   - It deploys to Production.
   - It creates a GitHub Release `v1.1.0`.

### Using Git Tags manually (Optional)

If you prefer to tag manually or want to trigger a deployment via tag (requires workflow modification, currently configured for branch push):

```bash
# 1. Create a tag
git tag v1.1.0

# 2. Push the tag
git push origin v1.1.0
```

*Note: The current `deploy.yml` is configured to trigger on branch push to `main` and uses the `package.json` version for the release tag. Pushing a tag manually won't trigger the current deployment logic unless we add `tags` to the trigger.*

---

## ⚡️ Quick Actions

### Promoting Develop to Production

1. Ensure `develop` is stable.
2. Open a PR: `develop` ➡️ `main`.
3. Review and Merge.
4. Watch the `CD - Deploy to Production` action runs.

### Rolling Back

If a bad deployment happens:
1. Go to Vercel Dashboard.
2. Navigate to Deployments.
3. Click on the previous successful deployment.
4. Click "Promote to Production" (Instant Rollback).
5. Then revert the bad commit in `main` to keep git in sync.

---

## 📝 Common Scenarios

**Q: I pushed to `develop`. What happens?**
A:
- **CI** runs tests and checks.
- **CD** runs and deploys to Vercel (Staging/Preview).

**Q: I created a PR.**
A:
- **CI** runs tests.
- **Preview Deploy** creates a temporary URL for that PR.

**Q: I merged to `main`.**
A:
- **CD** runs, builds for production, and updates the live site.
- A GitHub Release is created.

**Q: How do I skip CI for a small typo fix?**
A: Add `[skip ci]` to your commit message.
   ```bash
   git commit -m "Fix typo in readme [skip ci]"
   ```
