import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { TwitterApi } from 'twitter-api-v2';
import { config } from './config.js';

export function setupAuth(app) {
  if (!config.twitter.clientId || !config.twitter.clientSecret) {
    throw new Error('Twitter OAuth credentials are not configured');
  }

  // Configure OAuth 2.0 strategy
  passport.use(new OAuth2Strategy({
    authorizationURL: 'https://twitter.com/i/oauth2/authorize',
    tokenURL: 'https://api.twitter.com/2/oauth2/token',
    clientID: config.twitter.clientId,
    clientSecret: config.twitter.clientSecret,
    callbackURL: config.twitter.callbackUrl,
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const client = new TwitterApi(accessToken);
      const user = await client.v2.me();
      
      return done(null, {
        accessToken,
        refreshToken,
        profile: user.data
      });
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  return passport;
}