const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require('openai');

// توكن البوت الذي قدمه المستخدم
const BOT_TOKEN = "8216411891:AAE_PjNCSG1grB_IQy56ETCveyJDToLEXD0";

// إنشاء عميل تليجرام
// استخدام Long Polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// تهيئة عميل OpenAI
// سيستخدم المفتاح الموجود في متغير البيئة OPENAI_API_KEY
const openai = new OpenAI();

console.log('Telegram Bot is running...');

// معالجة أمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'مرحباً! أنا بوت ذكي يعمل بتقنية Manus AI. أرسل لي أي شيء لتبدأ المحادثة.');
});

// معالجة الرسائل النصية
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

  // تجاهل الأوامر (لأننا عالجنا /start بالفعل)
  if (userText.startsWith('/')) {
    return;
  }
  
  if (!userText) {
      return;
  }

  console.log(`Received message from ${chatId}: ${userText}`);

  try {
    // إرسال رسالة "جاري الكتابة..."
    await bot.sendChatAction(chatId, 'typing');

    // الاتصال بـ Manus AI (باستخدام OpenAI API)
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // استخدام نموذج Manus AI المتاح
      messages: [
        { role: "system", content: "أنت بوت ذكاء اصطناعي عربي متطور يعمل بتقنية Manus AI. مهمتك هي الإجابة على استفسارات المستخدمين بأسلوب ودود ومفيد." },
        { role: "user", content: userText }
      ],
    });

    const aiResponse = response.choices[0].message.content;

    // الرد على المستخدم
    bot.sendMessage(chatId, aiResponse);

  } catch (error) {
    console.error("Error calling Manus AI or sending message:", error);
    bot.sendMessage(chatId, "عذراً، حدث خطأ أثناء محاولة الاتصال بخدمة الذكاء الاصطناعي.");
  }
});

// معالجة الأخطاء
bot.on('polling_error', (error) => {
    console.error("Polling error:", error);
});
