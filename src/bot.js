import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import { processCommand } from './commands.js';

dotenv.config();

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const BOT_USERNAME = 'Tirage';

async function startBot() {
  try {
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
    });
  } catch (error) {
    console.error('Bot error:', error);
  }
}

startBot();