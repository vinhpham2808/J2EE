import moment from "moment";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isSupportedTransactionType = (value) => value === "income" || value === "expense";

export const normalizeTransactionMoment = (value) => {
  if (!value) return null;

  const rawValue = String(value).trim();
  if (!rawValue) return null;

  if (DATE_ONLY_PATTERN.test(rawValue)) {
    const dateOnlyMoment = moment(rawValue, "YYYY-MM-DD", true);
    return dateOnlyMoment.isValid() ? dateOnlyMoment : null;
  }

  const zonedMoment = moment.parseZone(rawValue);
  if (zonedMoment.isValid()) {
    return zonedMoment.local();
  }

  const localMoment = moment(rawValue);
  return localMoment.isValid() ? localMoment : null;
};

export const getTransactionDateKey = (value) => {
  const normalizedMoment = normalizeTransactionMoment(value);
  return normalizedMoment ? normalizedMoment.format("YYYY-MM-DD") : null;
};

export const resolveTransactionType = (transaction, fallbackType = "both") => {
  if (isSupportedTransactionType(transaction?.type)) {
    return transaction.type;
  }

  if (isSupportedTransactionType(fallbackType)) {
    return fallbackType;
  }

  return Number(transaction?.amount) < 0 ? "expense" : "income";
};

export const buildTransactionDayMap = (transactions = [], fallbackType = "both") => {
  const dayMap = new Map();

  for (const transaction of transactions) {
    const dateKey = getTransactionDateKey(transaction?.date);
    if (!dateKey) continue;

    const normalizedType = resolveTransactionType(transaction, fallbackType);
    const normalizedAmount = Math.abs(Number(transaction?.amount) || 0);

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        transactions: [],
        totals: {
          income: 0,
          expense: 0,
        },
      });
    }

    const dayEntry = dayMap.get(dateKey);
    dayEntry.transactions.push({
      ...transaction,
      amount: normalizedAmount,
      type: normalizedType,
    });
    dayEntry.totals[normalizedType] += normalizedAmount;
  }

  return dayMap;
};

export const buildCalendarDays = (currentMonth, now = moment()) => {
  const monthMoment = moment(currentMonth).isValid()
    ? moment(currentMonth).startOf("month")
    : moment().startOf("month");
  const calendarStart = monthMoment.clone().startOf("week");

  return Array.from({ length: 42 }, (_, index) => {
    const dayMoment = calendarStart.clone().add(index, "days");

    return {
      dateKey: dayMoment.format("YYYY-MM-DD"),
      date: dayMoment.clone(),
      dayNumber: dayMoment.date(),
      isCurrentMonth: dayMoment.isSame(monthMoment, "month"),
      isToday: dayMoment.isSame(now, "day"),
    };
  });
};

export const calculateMonthTotals = (transactions = [], currentMonth, fallbackType = "both") => {
  const monthMoment = moment(currentMonth).isValid()
    ? moment(currentMonth).startOf("month")
    : moment().startOf("month");

  return transactions.reduce(
    (totals, transaction) => {
      const transactionMoment = normalizeTransactionMoment(transaction?.date);
      if (!transactionMoment || !transactionMoment.isSame(monthMoment, "month")) {
        return totals;
      }

      const normalizedType = resolveTransactionType(transaction, fallbackType);
      const normalizedAmount = Math.abs(Number(transaction?.amount) || 0);
      totals[normalizedType] += normalizedAmount;
      totals.net = totals.income - totals.expense;
      return totals;
    },
    {
      income: 0,
      expense: 0,
      net: 0,
    },
  );
};

export const getDefaultSelectedDate = (currentMonth, dayMap, now = moment()) => {
  const monthMoment = moment(currentMonth).isValid()
    ? moment(currentMonth).startOf("month")
    : moment().startOf("month");

  if (!monthMoment.isSame(now, "month")) {
    return null;
  }

  const todayKey = now.format("YYYY-MM-DD");
  return dayMap?.has(todayKey) ? todayKey : null;
};

export const formatCompactTransactionAmount = (amount, transactionType) => {
  const normalizedAmount = Math.abs(Number(amount) || 0);
  const prefix = transactionType === "income" ? "+" : "-";

  if (normalizedAmount >= 1000000) {
    const millionValue = normalizedAmount / 1000000;
    return `${prefix}${millionValue.toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (normalizedAmount >= 1000) {
    const thousandValue = normalizedAmount / 1000;
    return `${prefix}${thousandValue.toFixed(1).replace(/\.0$/, "")}K`;
  }

  return `${prefix}${normalizedAmount}`;
};
