# Security Guidelines

## Overview

This document outlines security best practices for the PlayMoreTCG application, particularly around credential management and secret protection.

## Environment Variables

### Configuration Files

- **`.env`**: Template file with placeholder values (committed to version control)
- **`.env.local`**: Local configuration with actual credentials (NOT committed, gitignored)
- **Other `.env.*.local`**: Branch/environment-specific configurations (gitignored)

### Firebase Credentials

The application uses Firebase for authentication and Firestore database. All Firebase credentials are managed through environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Security Practices

### ✅ What Should Be Committed

- `.env` - Template with placeholder values
- Source code without hardcoded secrets
- Configuration files (`.gitignore`, `tsconfig.json`, etc.)
- Documentation (this `SECURITY.md` file)

### ❌ What Must NOT Be Committed

- `.env.local` - Actual Firebase credentials
- Any file containing `AIza` API keys
- API secrets, tokens, or passwords
- `*.local` files
- `.env` files (unless they only contain placeholders)

### Git Protection

The `.gitignore` file includes the following patterns to prevent credential leaks:

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.local
```

### Development Workflow

1. Copy the template:
   ```bash
   cp .env .env.local
   ```

2. Edit `.env.local` with your actual Firebase credentials
3. Verify the file is not committed using `git status`
4. The application will load credentials from `.env.local` automatically

### Production Deployment

⚠️ **IMPORTANT**: When deploying to production, NEVER use environment variables. Instead:

1. Configure Firebase Console with your credentials
2. Use Firebase Hosting's environment variables feature
3. For Web Apps, Firebase will handle authentication automatically

## Credential Protection Checklist

- [x] `.env` file uses placeholder values (committed)
- [x] Real credentials stored in `.env.local` (gitignored)
- [x] No hardcoded secrets in source code
- [x] `.gitignore` properly configured
- [x] Security documentation created
- [ ] Team members informed of security practices

## Common Security Mistakes

❌ **Don't**:
- Commit `.env.local` or any file with real credentials
- Share Firebase API keys via public chat or email
- Hardcode secrets in plain text files
- Push sensitive data to public repositories

✅ **Do**:
- Use `.env` for templates and `.env.local` for actual credentials
- Review git history before committing sensitive changes
- Rotate credentials if they are exposed
- Use Firebase's built-in security rules and authentication

## Additional Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/samples)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Secret Scanning](https://owasp.org/www-project-secret-skanning/)

## Support

If you believe credentials have been exposed:

1. Immediately regenerate Firebase API keys in Firebase Console
2. Update your `.env.local` file
3. Rotate any affected tokens if applicable
4. Review git history for any committed secrets