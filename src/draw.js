import { shuffle } from './utils.js';

// Simulate a live draw with multiple messages
export async function simulateLiveDraw(client, tweetId, winner, totalParticipants, participants) {
  const shuffledParticipants = shuffle(participants);
  const sampleSize = Math.min(5, participants.length);
  const participantsSample = shuffledParticipants.slice(0, sampleSize);
  
  const messages = [
    '🎯 Starting the draw...',
    `📊 ${totalParticipants} participants in this draw!`,
    `👥 Some participants:\n${participantsSample.map(p => `@${p}`).join('\n')}`,
    '🎲 Rolling the dice...',
    '🔄 Shuffling entries...',
    '✨ Drumroll please...',
    `🎉 And the winner is... @${winner}! Congratulations! 🎉`
  ];

  let lastMessageId = tweetId;
  for (const message of messages) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    const reply = await client.v2.reply(message, lastMessageId);
    lastMessageId = reply.data.id;
  }
  
  return lastMessageId;
}

export async function conductDraw(client, tweetId, options = {}) {
  const participants = new Set();
  const { includeLikes = true, includeComments = true, includeReposts = true } = options;

  try {
    // Get likes if enabled
    if (includeLikes) {
      const likers = await client.v2.tweetLikedBy(tweetId, {
        max_results: 100,
        'user.fields': ['username']
      });
      
      for (const user of likers.data || []) {
        participants.add(user.username);
      }
    }

    // Get comments if enabled
    if (includeComments) {
      const replies = await client.v2.search(`conversation_id:${tweetId}`, {
        max_results: 100,
        'tweet.fields': ['author_id'],
        'user.fields': ['username'],
        expansions: ['author_id']
      });
      
      for (const user of replies.includes?.users || []) {
        participants.add(user.username);
      }
    }

    // Get reposts if enabled
    if (includeReposts) {
      const retweets = await client.v2.tweetRetweetedBy(tweetId, {
        max_results: 100,
        'user.fields': ['username']
      });
      
      for (const user of retweets.data || []) {
        participants.add(user.username);
      }
    }

    const participantsList = Array.from(participants);
    if (participantsList.length === 0) {
      return {
        success: false,
        message: "No participants found for the draw."
      };
    }

    const winner = shuffle(participantsList)[0];
    return {
      success: true,
      winner,
      totalParticipants: participantsList.length,
      participants: participantsList
    };
  } catch (error) {
    console.error('Error conducting draw:', error);
    return {
      success: false,
      message: "An error occurred while conducting the draw."
    };
  }
}