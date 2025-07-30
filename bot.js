const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual bot token from BotFather
const BOT_TOKEN = '7783593977:AAG-HB3DZn9mX3L1s9UVL4Gc5qRjyt2FzGg';
const BACKEND_URL = 'http://localhost:3000';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Telegram bot is running...');

// Handle /start command with optional referral
bot.onText(/\/start(?:\s+ref_(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `user_${chatId}`;
  const referredId = chatId.toString();
  const referrerId = match[1]; // This is undefined if no referral

  try {
    console.log(`User ${username} (${chatId}) started the bot${referrerId ? ` with referral from ${referrerId}` : ''}`);

    // Register the user in your backend
    const registerResponse = await axios.post(`${BACKEND_URL}/api/register`, {
      username: `tg_${username}_${chatId}`
    });

    if (registerResponse.data.userId) {
      console.log(`User registered with ID: ${registerResponse.data.userId}`);

      // If there is a referrer, record the referral
      if (referrerId) {
        try {
          await axios.post(`${BACKEND_URL}/api/refer`, {
            referrerId: referrerId,
            referredId: registerResponse.data.userId
          });
          
          // Send reward message to both users
          bot.sendMessage(chatId, 
            '🎉 Welcome! You were referred by a friend!\n' +
            'You both received 500 fragments as a reward!\n\n' +
            'Play the game: ' + registerResponse.data.referralLink
          );

          // Notify the referrer (optional)
          try {
            bot.sendMessage(referrerId, 
              '🎉 Someone used your referral link!\n' +
              'You received 500 fragments as a reward!'
            );
          } catch (err) {
            console.log('Could not notify referrer:', err.message);
          }

        } catch (referError) {
          console.error('Error recording referral:', referError.message);
          bot.sendMessage(chatId, 
            'Welcome! There was an issue with the referral, but you can still play!\n\n' +
            'Play the game: ' + registerResponse.data.referralLink
          );
        }
      } else {
        // No referral, just welcome message
        bot.sendMessage(chatId, 
          '🐢 Welcome to World Turtle!\n\n' +
          'Tap the turtle to earn fragments and upgrade your world!\n\n' +
          'Play the game: ' + registerResponse.data.referralLink
        );
      }
    }

  } catch (error) {
    console.error('Error registering user:', error.message);
    bot.sendMessage(chatId, 
      'Sorry, there was an error. Please try again later or contact support.'
    );
  }
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🐢 World Turtle Bot Help\n\n' +
    '/start - Start playing the game\n' +
    '/start ref_USERID - Start with a referral link\n' +
    '/help - Show this help message\n\n' +
    'Share your referral link with friends to earn bonus fragments!'
  );
});

// Handle /stats command (optional)
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = chatId.toString();
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/user/${userId}`);
    const userData = response.data;
    
    bot.sendMessage(chatId, 
      `📊 Your Stats\n\n` +
      `Username: ${userData.username}\n` +
      `Level: ${userData.level}\n` +
      `Tasks Done: ${userData.tasksDone}\n` +
      `Referrals: ${userData.referrals.length}\n\n` +
      `Your referral link: ${userData.referralLink}`
    );
  } catch (error) {
    bot.sendMessage(chatId, 'Could not load your stats. Please try again later.');
  }
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

module.exports = bot; 