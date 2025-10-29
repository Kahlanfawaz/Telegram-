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

// تخزين سجل المحادثات لكل مستخدم
// المفتاح هو chat_id والقيمة هي مصفوفة من الرسائل (messages)
const conversationHistory = new Map();

// رسالة النظام الأساسية
const systemMessage = { role: "system", content: "أنت بوت ذكاء اصطناعي عربي متطور يعمل بتقنية Manus AI. مهمتك هي الإجابة على استفسارات المستخدمين بأسلوب ودود ومفيد." };

console.log('Telegram Bot is running...');

// معالجة أمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  // عند بدء التشغيل، يتم مسح أي سجل محادثة سابق وبدء سجل جديد برسالة النظام
  conversationHistory.set(chatId, [systemMessage]);
  bot.sendMessage(chatId, 'مرحباً! أنا بوت ذكي يعمل بتقنية Manus AI. أرسل لي أي شيء لتبدأ المحادثة.\n\nاستخدم /help لمعرفة المزيد عن الأوامر المتاحة.');
});

// معالجة أمر /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
**قائمة الأوامر المتاحة:**

/start - بدء المحادثة والترحيب.
/newchat - مسح سجل المحادثة الحالي وبدء محادثة جديدة مع الذكاء الاصطناعي.
/help - عرض قائمة الأوامر هذه.
    `;
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// معالجة أمر /newchat
bot.onText(/\/newchat/, (msg) => {
    const chatId = msg.chat.id;
    // مسح سجل المحادثة
    conversationHistory.set(chatId, [systemMessage]);
    bot.sendMessage(chatId, 'تم مسح سجل المحادثة بنجاح. يمكنك الآن بدء محادثة جديدة.');
});

// معالجة الرسائل النصية
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userText = msg.text;

    // تجاهل الأوامر (تمت معالجتها بواسطة onText)
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

    // الحصول على سجل المحادثة أو البدء بسجل جديد
    let messages = conversationHistory.get(chatId);
    if (!messages) {
        messages = [systemMessage];
    }

    // إضافة رسالة المستخدم إلى السجل
    messages.push({ role: "user", content: userText });

    // الاتصال بـ Manus AI (باستخدام OpenAI API)
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // استخدام نموذج Manus AI المتاح
      messages: messages,
    });

    const aiResponse = response.choices[0].message.content;

    // إضافة رد الذكاء الاصطناعي إلى السجل
    messages.push({ role: "assistant", content: aiResponse });
    conversationHistory.set(chatId, messages);

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
