dotenv.config();
import { Telegraf } from "telegraf";
import nodemailer from "nodemailer";
import validator from "validator";
import moment from "moment";
import dotenv from "dotenv";
import { AllBlocks, MainBlock } from "../@types/message";
import { createCalendar } from "./calendar";

// Настройка почтового транспорта для отправки email от почты бота
const transporter = nodemailer.createTransport({
  service: "yandex",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Вставь сюда токен своего бота
const bot = new Telegraf(process.env.BOT_TOKEN as string);

const oMainBlock: MainBlock = {
  key: "main_info",
  title: "Основная информация",
  answer: "Вы выбрали анкету - 'Основная  информация'",
  blocks: [
    // {
    //   key: "name",
    //   text: "Заполните пожалуйста ФИО:",
    //   type: "text",
    // },
    // {
    //   key: "email",
    //   text: "Заполните пожалуйста почту:",
    //   type: "text",
    //   validation: (mail: string) => validator.isEmail(mail),
    //   errorMessage: "Введите корректный email",
    // },
    {
      key: "date",
      text: "Заполните пожалуйста дату рождения:",
      type: "date",
    },
  ],
};

const oSecondBlock: MainBlock = {
  key: "sec_info",
  title: "Дополнительная информация",
  answer: "Вы выбрали анкету - 'Дополнительная информация'",
  blocks: [
    {
      key: "name",
      text: "Имя",
      type: "text",
    },
    {
      key: "email",
      text: "Email",
      type: "text",
    },
    {
      key: "date",
      text: "Дата посещения",
      type: "date",
    },
  ],
};

const oThirdBlock: MainBlock = {
  key: "third_info",
  title: "Дополнительная информация (2)",
  answer: "Вы выбрали анкету - 'Второстепенная информация'",
  blocks: [
    {
      key: "name",
      text: "Имя",
      type: "text",
    },
    {
      key: "email",
      text: "Email",
      type: "text",
    },
    {
      key: "date",
      text: "Дата посещения",
      type: "date",
    },
  ],
};

const aBlocks: AllBlocks = [oMainBlock, oSecondBlock, oThirdBlock];

const aKeyBoards = aBlocks.map((o) => [o.title]);

const aInlineKeyBoards = aBlocks.map((o) => [
  {
    text: o.title,
    callback_data: o.key,
  },
]);

const userForms = aBlocks.reduce((acc, val) => {
  acc[val.title] = {
    data: {},
  };
  return acc;
}, {});

const selectedBlock = {
  key: "",
  step: 0,
};

// Инициализация календаря
const calendar = createCalendar(bot);

// Обработчик команды /start
bot.start(async (ctx) => {
  const sTitle = `Привет, ${ctx.message.from.last_name} ${ctx.message.from.first_name}!`;
  await ctx.reply(sTitle, {
    reply_markup: {
      keyboard: aKeyBoards, // Обычная клавиатура
      resize_keyboard: true, // Чтобы клавиатура подстраивалась по размеру
    },
  });

  await ctx.reply(
    "Выбери необходимую анкету из меню:", // Пустое сообщение для инлайн-кнопок
    {
      reply_markup: {
        inline_keyboard: aInlineKeyBoards, // Инлайн-кнопки
      },
    }
  );
});

// Обработчик текстовых сообщений
bot.on("text", (ctx) => {
  const sMessage = ctx.message.text,
    oFindBlock = aBlocks.find(
      (o) => o.title === sMessage || o.title === selectedBlock.key
    );
  selectedBlock.key = oFindBlock.title;

  const oForm = userForms[selectedBlock.key];

  if (!oForm) {
    ctx.reply("Выберите анкету из меню");
    return;
  }
  const oCurrentStep = oFindBlock.blocks[selectedBlock.step];
  if (sMessage === selectedBlock.key) {
    if (oCurrentStep && oCurrentStep.type === "date") {
      ctx.reply(
        `${oFindBlock.answer}. \n${oCurrentStep.text}`,
        calendar.getCalendar()
      );
      return;
    }
    ctx.reply(`${oFindBlock.answer}. \n${oCurrentStep.text}`);
    return;
  }
  const oNextStep = oFindBlock.blocks[selectedBlock.step + 1];
  if (oCurrentStep.validation && !oCurrentStep.validation(sMessage)) {
    ctx.reply(oCurrentStep.errorMessage as string);
    return;
  }
  oForm.data[oCurrentStep.key] = sMessage;
  selectedBlock.step++;
  if (!oNextStep) {
    sendEmail(transporter, oForm.data, ctx);
    return;
  }
  if (oNextStep && oNextStep.type === "date") {
    ctx.reply(oNextStep.text, calendar.getCalendar());
    return;
  }
  ctx.reply(oNextStep.text);
});

// Использование встроенного метода setDateListener для обработки выбора даты и переключения месяцев/годов
calendar.setDateListener((ctx, date) => {
  // Преобразуем дату в формат ДД.ММ.ГГГГ
  const formattedDate = moment(date, "YYYY-MM-DD").format("DD.MM.YYYY");
});

function clearForm() {
  userForms[selectedBlock.key] = {
    data: {},
  };
  selectedBlock.key = "";
  selectedBlock.step = 0;
}
// Функция для отправки email
function sendEmail(transporter, formData, ctx) {
  const sMessage = Object.entries(formData).reduce((acc, [key, value]) => {
    acc += `${key}: ${value}\n`;
    return acc;
  }, "");
  const mailOptions = {
    from: "atlets-sport@yandex.ru",
    to: "atlets-sport@yandex.ru", // Фиксированный адрес для получения форм
    subject: `Заполненная анкета ${formData.name}`,
    text: sMessage,
  };

  clearForm();
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      ctx.reply(
        "Произошла ошибка при отправке email. Пожалуйста, попробуйте позже."
      );
    } else {
      console.log("Email sent: " + info.response);
      ctx.reply("Анкета заполнена и отправлена на почту!");
    }
  });
}

// Запуск бота
bot.launch();
