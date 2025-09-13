import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Customize Auth0 to always use Google and land on /dashboard
export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        returnTo: '/dashboard',
        authorizationParams: {
          // Force Google as the IdP
          connection: 'google-oauth2'
        }
      });
    } catch (error) {
      // Let the SDK handle error responses
      throw error;
    }
  }
});
