import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from openai import OpenAI

# إعداد التسجيل (Logging)
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# توكن البوت الذي قدمه المستخدم
# يجب استبدال هذا التوكن بالتوكن الحقيقي عند التشغيل
BOT_TOKEN = "8216411891:AAE_PjNCSG1grB_IQy56ETCveyJDToLEXD0"

# تهيئة عميل OpenAI
# سيستخدم المفتاح الموجود في متغير البيئة OPENAI_API_KEY
try:
    client = OpenAI()
except Exception as e:
    logging.error(f"Failed to initialize OpenAI client: {e}")
    client = None

# وظيفة معالجة أمر /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a welcome message when the command /start is issued."""
    await update.message.reply_text(
        'مرحباً! أنا بوت ذكي يعمل بتقنية Manus AI. أرسل لي أي شيء لتبدأ المحادثة.'
    )

# وظيفة معالجة الرسائل النصية ودمج الذكاء الاصطناعي (سيتم تطويرها في المرحلة التالية)
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Processes user text message and sends it to the AI for a response."""
    user_text = update.message.text
    chat_id = update.message.chat_id
    
    logging.info(f"Received message from {chat_id}: {user_text}")
    
    if not client:
        await update.message.reply_text("عذراً، لم يتم تهيئة خدمة الذكاء الاصطناعي بنجاح.")
        return

    try:
        # إرسال رسالة "جاري الكتابة..."
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')
        
        # الاتصال بـ Manus AI (باستخدام OpenAI API)
        response = client.chat.completions.create(
            model="gpt-4.1-mini", # استخدام نموذج Manus AI المتاح
            messages=[
                {"role": "system", "content": "أنت بوت ذكاء اصطناعي عربي متطور يعمل بتقنية Manus AI. مهمتك هي الإجابة على استفسارات المستخدمين بأسلوب ودود ومفيد."},
                {"role": "user", "content": user_text}
            ]
        )
        
        ai_response = response.choices[0].message.content
        
        # الرد على المستخدم
        await update.message.reply_text(ai_response)
        
    except Exception as e:
        logging.error(f"Error calling Manus AI: {e}")
        await update.message.reply_text("عذراً، حدث خطأ أثناء محاولة الاتصال بخدمة الذكاء الاصطناعي.")

def main() -> None:
    """Start the bot."""
    # إنشاء التطبيق وتمرير توكن البوت
    application = Application.builder().token(BOT_TOKEN).build()

    # إضافة معالجات الأوامر والرسائل
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # بدء تشغيل البوت باستخدام Long Polling
    logging.info("Starting bot with Long Polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
