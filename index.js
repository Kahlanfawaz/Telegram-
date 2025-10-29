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
const systemMessage = { role: "system", content: "أنت بوت ذكاء اصطناعي عربي متطور يعمل بتقنية Manus AI. مهمتك هي الإجابة على استفسارات المستخدمين بأسلوب ودود ومفيد وتقديم المساعدة في التلخيص والترجمة وتوليد الصور. يجب عليك استخدام اللغة العربية الفصحى قدر الإمكان." };

console.log('Telegram Bot is running...');

// تسجيل قائمة الأوامر في تليجرام
const setCommands = async () => {
    const commands = [
        { command: 'start', description: 'بدء المحادثة والترحيب' },
        { command: 'help', description: 'عرض قائمة الأوامر المتاحة' },
        { command: 'newchat', description: 'مسح سجل المحادثة وبدء محادثة جديدة' },
        { command: 'summarize', description: 'تلخيص النص الذي يليه (مثال: /summarize نص طويل)' },
        { command: 'translate', description: 'ترجمة النص (مثال: /translate English مرحبا)' },
        { command: 'image', description: 'توليد صورة (مثال: /image قطة تطير في الفضاء)' },
    ];

    try {
        await bot.setMyCommands(commands);
        console.log('Telegram commands set successfully.');
    } catch (error) {
        console.error('Failed to set Telegram commands:', error);
    }
};

setCommands();

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

// معالجة أمر /summarize
bot.onText(/\/summarize (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const textToSummarize = match[1].trim();

    if (!textToSummarize) {
        return bot.sendMessage(chatId, 'الرجاء إدخال النص المراد تلخيصه بعد الأمر /summarize.');
    }

    try {
        await bot.sendChatAction(chatId, 'typing');
        
        const response = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "system", content: "أنت خبير في التلخيص. مهمتك هي تلخيص النص المقدم بأسلوب واضح وموجز وبلغة عربية فصحى." },
                { role: "user", content: `قم بتلخيص النص التالي: ${textToSummarize}` }
            ],
        });

        const summary = response.choices[0].message.content;
        bot.sendMessage(chatId, `**ملخص النص:**\n\n${summary}`, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("Error calling AI for summarization:", error);
        bot.sendMessage(chatId, "عذراً، حدث خطأ أثناء محاولة تلخيص النص.");
    }
});

// معالجة أمر /translate
bot.onText(/\/translate (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const textAndTarget = match[1].trim();

    // افتراض أن المستخدم سيحدد اللغة الهدف أولاً، ثم النص
    // مثال: /translate English مرحبا بكم
    const parts = textAndTarget.split(/\s+/, 2); // فصل أول كلمتين (اللغة والنص المتبقي)

    if (parts.length < 2) {
        return bot.sendMessage(chatId, 'الرجاء إدخال اللغة الهدف والنص المراد ترجمته. مثال: /translate English مرحبا بكم');
    }

    const targetLanguage = parts[0];
    const textToTranslate = textAndTarget.substring(targetLanguage.length).trim();

    if (!textToTranslate) {
        return bot.sendMessage(chatId, 'الرجاء إدخال النص المراد ترجمته.');
    }

    try {
        await bot.sendChatAction(chatId, 'typing');
        
        const response = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "system", content: `أنت مترجم محترف. مهمتك هي ترجمة النص المقدم إلى اللغة ${targetLanguage} بدقة واحترافية.` },
                { role: "user", content: `ترجم هذا النص إلى ${targetLanguage}: ${textToTranslate}` }
            ],
        });

        const translation = response.choices[0].message.content;
        bot.sendMessage(chatId, `**الترجمة إلى ${targetLanguage}:**\n\n${translation}`, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("Error calling AI for translation:", error);
        bot.sendMessage(chatId, "عذراً، حدث خطأ أثناء محاولة الترجمة.");
    }
});

// معالجة أمر /image
bot.onText(/\/image (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1].trim();

    if (!prompt) {
        return bot.sendMessage(chatId, 'الرجاء إدخال وصف الصورة المراد توليدها بعد الأمر /image.');
    }

    try {
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // الاتصال بـ Manus AI لتوليد الصورة
        const response = await openai.images.generate({
            model: "dall-e-3", // استخدام نموذج DALL-E 3 لتوليد الصور
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data[0].url;
        
        // إرسال الصورة إلى المستخدم
        bot.sendPhoto(chatId, imageUrl, { caption: `**الصورة التي تم توليدها بناءً على الوصف:**\n\n_${prompt}_`, parse_mode: 'Markdown' });

    } catch (error) {
        console.error("Error calling AI for image generation:", error);
        bot.sendMessage(chatId, "عذراً، حدث خطأ أثناء محاولة توليد الصورة. تأكد من أن الوصف مناسب.");
    }
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
      model: "gemini-2.5-flash", // استخدام نموذج Manus AI المتاح
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
