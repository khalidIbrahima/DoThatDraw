import express from 'express';
import session from 'express-session';
import { setupAuth } from './auth.js';
import { startBot } from './bot.js';
import { config } from './config.js';

const app = express();

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

try {
  // Initialize authentication
  const passport = setupAuth(app);
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get('/auth/twitter', passport.authenticate('oauth2'));

  app.get('/auth/twitter/callback',
    passport.authenticate('oauth2', { failureRedirect: '/login' }),
    (req, res) => {
      // Start the bot with authenticated client
      startBot(req.user.accessToken);
      res.send('Bot authenticated and started successfully!');
    }
  );

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}