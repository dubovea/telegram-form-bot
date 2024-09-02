const { Telegraf } = require("telegraf");
const Calendar = require("telegraf-calendar"); // Используем telegraf-calendar
const nodemailer = require("nodemailer");
const validator = require("validator");
const moment = require("moment"); // Для форматирования даты
require('dotenv').config()

// Вставь сюда токен своего бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройка почтового транспорта для отправки email от почты бота
const transporter = nodemailer.createTransport({
  service: "yandex",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const userForms = {};

// Инициализация календаря
const calendar = new Calendar(bot, {
  startWeekDay: 1, // Неделя начинается с понедельника
  weekDayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  monthNames: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  minDate: new Date(1900, 0, 1), // Минимальная дата
  maxDate: new Date(2100, 11, 31), // Максимальная дата
  currentDate: new Date(), // Текущая дата
  dateFormat: "DD.MM.YYYY", // Формат даты
});

// Обработчик команды /start
bot.start((ctx) => {
  const chatId = ctx.chat.id;
  userForms[chatId] = { step: 0, data: {} };
  ctx.reply("Привет! Давайте заполним анкету.");
  ctx.reply("Введите ваше ФИО:");
});

// Обработчик текстовых сообщений
bot.on("text", (ctx) => {
  const chatId = ctx.chat.id;

  if (userForms[chatId]) {
    const userData = userForms[chatId];
    const step = userData.step;

    if (step === 0) {
      // Шаг 1: ФИО
      userForms[chatId].data.name = ctx.message.text;
      userForms[chatId].step++;
      ctx.reply("Введите вашу электронную почту:");
    } else if (step === 1) {
      // Шаг 2: Email
      const email = ctx.message.text;
      if (validator.isEmail(email)) {
        userForms[chatId].data.email = email;
        userForms[chatId].step++;
        ctx.reply("Выберите дату посещения:", calendar.getCalendar());
      } else {
        ctx.reply("Некорректный формат email. Пожалуйста, введите снова:");
      }
    }
  }
});

// Использование встроенного метода setDateListener для обработки выбора даты и переключения месяцев/годов
calendar.setDateListener((ctx, date) => {
  const chatId = ctx.chat.id;
  if (userForms[chatId]) {
    userForms[chatId].data.date = date;

    // Преобразуем дату в формат ДД.ММ.ГГГГ
    const formattedDate = moment(date, "YYYY-MM-DD").format("DD.MM.YYYY");

    // Отправка email на фиксированный адрес
    sendEmail(transporter, userForms[chatId].data, formattedDate, ctx);

    ctx.reply(`Спасибо! Ваша дата рождения: ${formattedDate}`);
    ctx.reply("Анкета заполнена и отправлена на почту.");
    delete userForms[chatId]; // Удаляем данные после отправки
  }
});

// Функция для отправки email
function sendEmail(transporter, formData, formattedDate, ctx) {
  const mailOptions = {
    from: "atlets-sport@yandex.ru",
    to: "atlets-sport@yandex.ru", // Фиксированный адрес для получения форм
    subject: `Заполненная анкета ${formData.name}`,
    text: `ФИО: ${formData.name}\nДата рождения: ${formattedDate}\nEmail пользователя: ${formData.email}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      ctx.reply(
        "Произошла ошибка при отправке email. Пожалуйста, попробуйте позже."
      );
    } else {
      console.log("Email sent: " + info.response);
      ctx.reply("Email успешно отправлен!");
    }
  });
}

// Запуск бота
bot.launch();
