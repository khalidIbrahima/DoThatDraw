import { TwitterApi } from 'twitter-api-v2';
import { config } from './config.js';
import { processCommand } from './commands.js';

const BOT_USERNAME = 'Tirage';
let client = null;

export async function startBot(accessToken) {
  try {
    // Initialize Twitter client with OAuth2 access token
    client = new TwitterApi(accessToken);

    // Verify credentials
    const currentUser = await client.v2.me();
    console.log(`Bot authenticated as: ${currentUser.data.username}`);

    const rules = await client.v2.streamRules();
    if (rules.data?.length) {
      await client.v2.updateStreamRules({
        delete: { ids: rules.data.map(rule => rule.id) },
      });
    }

    // Add rule to track mentions of your bot
    await client.v2.updateStreamRules({
      add: [{ value: `@${BOT_USERNAME}` }],
    });

    const stream = await client.v2.searchStream({
      'tweet.fields': ['referenced_tweets', 'author_id'],
      'user.fields': ['username'],
      expansions: ['author_id'],
    });

    console.log('🤖 Bot is running and listening for mentions...');

    stream.on('data', async tweet => {
      // Ignore retweets or self-tweets
      if (tweet.data.referenced_tweets?.some(t => t.type === 'retweet') ||
          tweet.includes.users[0].username === BOT_USERNAME) {
        return;
      }

      await processCommand(client, tweet);
    });

    stream.on('error', error => {
      console.error('Stream error:', error);
      // Attempt to reconnect after a delay
      setTimeout(() => startBot(accessToken), 5000);
    });
  } catch (error) {
    console.error('Bot error:', error);
    throw error;
  }
}