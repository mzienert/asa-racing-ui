# asaRacing UI

Part of the asaRacing Stack - A rapid application deployment framework

## Version Compatibility
- asaRacing-ui: v0.1.0
- asaRacing-core: v0.1.0
- asaRacing-api: v0.1.0

## Quick Start
[Instructions]

## Configuration
[Configuration details]

## Integration Points
[How this connects with other asaRacing components]

## Environment Variables

This application requires certain environment variables to be set for proper functionality, especially for authentication with AWS Cognito.

### Setup Instructions

1. Copy the `.env.example` file to create a new `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in the `.env.local` file:
   ```
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_actual_user_pool_id
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your_actual_client_id
   ```

3. **IMPORTANT**: Never commit your `.env.local` file to version control. It's already included in `.gitignore` to prevent accidental commits.

### Security Considerations

- The Cognito User Pool ID and Client ID are considered sensitive and should not be hardcoded in your application code.
- For local development, use `.env.local` which is not committed to git.
- For production deployments, set these environment variables in your hosting platform (Vercel, Netlify, AWS, etc.).
- If you're using CI/CD pipelines, ensure these values are stored as secure environment variables in your CI/CD platform.