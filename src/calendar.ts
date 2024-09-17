import { Telegraf } from "telegraf";
import Calendar from "telegraf-calendar";
// Инициализация календаря
export const createCalendar = (bot: Telegraf) => {
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

  return calendar;
};
