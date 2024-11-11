import { conductDraw, simulateLiveDraw } from './draw.js';
import { parseDrawOptions } from './utils.js';

export async function processCommand(client, tweet) {
  const tweetText = tweet.data.text.toLowerCase();
  const authorUsername = tweet.includes.users[0].username;

  try {
    // Help command
    if (tweetText.includes('help')) {
      await client.v2.reply(
        'Hello! Here are my commands:\n' +
        '- help: Show this message\n' +
        '- draw: Conduct a draw from the parent tweet\'s interactions\n' +
        'Options for draw:\n' +
        '- no-likes: Exclude likes\n' +
        '- no-comments: Exclude comments\n' +
        '- no-reposts: Exclude reposts',
        tweet.data.id
      );
      return;
    }

    // Draw command
    if (tweetText.includes('draw4Us')) {
      // Check if this is a reply to another tweet
      const parentTweet = tweet.data.referenced_tweets?.find(t => t.type === 'replied_to');
      if (!parentTweet) {
        await client.v2.reply(
          `@${authorUsername} Please use the draw command as a reply to the tweet you want to draw from!`,
          tweet.data.id
        );
        return;
      }

      // Parse options from the command
      const options = parseDrawOptions(tweetText);

      // Initial announcement
      await client.v2.reply(
        `🎲 Draw requested by @${authorUsername}\n\n` +
        `Including: ${options.includeLikes ? '❤️ Likes ' : ''}` +
        `${options.includeComments ? '💬 Comments ' : ''}` +
        `${options.includeReposts ? '🔄 Reposts' : ''}`,
        tweet.data.id
      );

      // Conduct the draw
      const result = await conductDraw(client, parentTweet.id, options);

      if (!result.success) {
        await client.v2.reply(
          `@${authorUsername} ${result.message}`,
          tweet.data.id
        );
        return;
      }

      // Simulate live draw with multiple messages
      const lastMessageId = await simulateLiveDraw(
        client, 
        tweet.data.id, 
        result.winner, 
        result.totalParticipants,
        result.participants
      );

      // Final statistics
      await client.v2.reply(
        `📊 Final Draw Statistics:\n\n` +
        `Total Participants: ${result.totalParticipants}\n` +
        `🏆 Winner: @${result.winner}\n\n` +
        `Thank you everyone for participating! 🙏\n` +
        `Stay tuned for more draws! 🎉`,
        lastMessageId
      );
    } else {
      // Default response for unknown commands
      await client.v2.reply(
        `@${authorUsername} I didn't understand that command. Try "help" to see what I can do!`,
        tweet.data.id
      );
    }
  } catch (error) {
    console.error('Error processing command:', error);
    await client.v2.reply(
      `@${authorUsername} Sorry, an error occurred while processing your request.`,
      tweet.data.id
    );
  }
}