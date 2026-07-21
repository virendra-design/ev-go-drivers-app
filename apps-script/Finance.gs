/**
 * EV GO Drivers App - Financial & Duty Hours Engine
 */
function getFinancialDashboard(driverId, fromDateStr, toDateStr, selectedMonth) {
  try {
    if (!driverId) return { success: false, message: "Driver ID required." };

    const sheet = getAttendanceSheet();
    if (!sheet || sheet.getLastRow() < 2) return _emptyFinancialResponse();

    const displayData = sheet.getDataRange().getDisplayValues();
    const rawData = sheet.getDataRange().getValues();
    const searchDriverId = driverId.toString().trim().toLowerCase();
    const clientConfigMap = (typeof CLIENT_CONFIG !== 'undefined') ? CLIENT_CONFIG : {};

    let dayMap = {};
    let totalBase = 0, totalIncentive = 0, totalDeduction = 0, totalNet = 0;
    let todayEarnings = 0;

    // Login Duration Trackers (in Milliseconds)
    let todayMs = 0;
    let weeklyMsMap = {};
    let monthlyMs = 0;

    let rangeWorkingDaysSet = new Set();
    let monthWorkingDaysSet = new Set();

    let monthBase = 0, monthIncentive = 0, monthDeduction = 0, monthNet = 0;

    const tz = Session.getScriptTimeZone();
    const now = new Date();
    const todayStr = formatYYYYMMDD(now);
    const targetMonthStr = selectedMonth || Utilities.formatDate(now, tz, "yyyy-MM");
    const currentMonthPrefix = Utilities.formatDate(now, tz, "yyyy-MM");

    // 7 days boundary for weekly average
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    const fromDate = fromDateStr ? new Date(fromDateStr) : null;
    const toDate = toDateStr ? new Date(toDateStr + 'T23:59:59') : null;

    for (let i = 1; i < displayData.length; i++) {
      const rowDriverId = (displayData[i][0] || "").toString().trim().toLowerCase();
      if (rowDriverId !== searchDriverId) continue;

      const dateStr = formatYYYYMMDD(rawData[i][1]);
      if (!dateStr) continue;

      const shiftDate = new Date(dateStr);
      const timeInStr = (displayData[i][2] || "").trim();
      const timeOutStr = (displayData[i][3] || "").trim();
      const status = (displayData[i][4] || "ACTIVE").trim();
      const client = (displayData[i][6] || "Fairdeal").trim();
      const clientInfo = clientConfigMap[client] || { rate: 750, maxHours: 12 };

      const isCompleted = (timeOutStr !== "" && timeOutStr !== "Pending" && status === "COMPLETED");
      const rawEpoch = Number(rawData[i][7]);

      let shiftDurationMs = 0;
      if (!isNaN(rawEpoch) && rawEpoch > 0) {
        let endMs = isCompleted ? new Date(dateStr + 'T' + timeOutStr).getTime() : now.getTime();
        shiftDurationMs = Math.max(0, isNaN(endMs) ? 0 : endMs - rawEpoch);
      }

      let effectiveHours = Math.min(shiftDurationMs / (1000 * 60 * 60), clientInfo.maxHours);
      let base = Math.round(effectiveHours * (clientInfo.rate / clientInfo.maxHours));
      if (base === 0 && isCompleted) base = Number(rawData[i][5]) || clientInfo.rate;

      const incentive = Number(rawData[i][8]) || 0;
      const deduction = Number(rawData[i][9]) || 0;
      const net = base + incentive - deduction;

      // 1. Today's Login Hours
      if (dateStr === todayStr) {
        todayMs += shiftDurationMs;
        todayEarnings += net;
      }

      // 2. Weekly Login Hours (Last 7 days)
      if (shiftDate >= sevenDaysAgo) {
        if (!weeklyMsMap[dateStr]) weeklyMsMap[dateStr] = 0;
        weeklyMsMap[dateStr] += shiftDurationMs;
      }

      // 3. Monthly Total Hours (Current Month)
      if (dateStr.startsWith(currentMonthPrefix)) {
        monthlyMs += shiftDurationMs;
      }

      // Monthly Payslip Tracker
      if (dateStr.startsWith(targetMonthStr)) {
        monthBase += base;
        monthIncentive += incentive;
        monthDeduction += deduction;
        monthNet += net;

        if (isCompleted || shiftDurationMs > 0) {
          monthWorkingDaysSet.add(dateStr);
        }
      }

      // Date Range Filter
      if (fromDate && shiftDate < fromDate) continue;
      if (toDate && shiftDate > toDate) continue;

      if (isCompleted || shiftDurationMs > 0) {
        rangeWorkingDaysSet.add(dateStr);
      }

      totalBase += base;
      totalIncentive += incentive;
      totalDeduction += deduction;
      totalNet += net;

      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { date: dateStr, client: client, totalDurationMs: 0, netPayout: 0, hasActive: false };
      }

      dayMap[dateStr].totalDurationMs += shiftDurationMs;
      dayMap[dateStr].netPayout += net;
      if (!isCompleted) dayMap[dateStr].hasActive = true;
    }

    let statements = Object.keys(dayMap).map(dateKey => {
      const item = dayMap[dateKey];
      const hrs = Math.floor(item.totalDurationMs / (1000 * 60 * 60));
      const mins = Math.floor((item.totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        date: item.date,
        client: item.client,
        durationStr: `${hrs}h ${mins}m`,
        netPayout: item.netPayout,
        hasActive: item.hasActive
      };
    });

    statements.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Weekly Avg Hours
    const weeklyActiveDays = Object.keys(weeklyMsMap).length || 1;
    const weeklyTotalMs = Object.values(weeklyMsMap).reduce((a, b) => a + b, 0);
    const weeklyAvgMs = Math.round(weeklyTotalMs / Math.max(1, weeklyActiveDays));

    const formatMsToHrsMins = ms => {
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    };

    const monthDisplayName = Utilities.formatDate(new Date(targetMonthStr + "-01"), tz, "MMMM yyyy");

    return {
      success: true,
      todayEarnings: todayEarnings,
      totalEarnings: totalNet,
      totalBase: totalBase,
      totalIncentives: totalIncentive,
      totalDeductions: totalDeduction,
      daysWorked: rangeWorkingDaysSet.size,
      todayHoursStr: formatMsToHrsMins(todayMs),
      weeklyAvgHoursStr: formatMsToHrsMins(weeklyAvgMs),
      monthlyHoursStr: formatMsToHrsMins(monthlyMs),
      statements: statements,
      monthlySummary: {
        month: monthDisplayName,
        workingDays: monthWorkingDaysSet.size,
        totalRevenue: monthBase,
        incentive: monthIncentive,
        penalty: monthDeduction,
        netPayout: monthNet
      }
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}
