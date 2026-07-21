/**
 * EV GO Drivers App - Attendance & Day-by-Day Consolidation Engine
 */
function getAttendanceSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheetName = (typeof SHEETS !== 'undefined' && SHEETS.ATTENDANCE) ? SHEETS.ATTENDANCE : "Attendance";
  let sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
    sheet.appendRow([
      "Driver ID", "Date", "Time In", "Time Out", "Status", "Daily Payout",
      "Client", "MarkInEpoch", "Incentive", "Deduction", "Notes", "Selfie In",
      "GPS In", "Selfie Out", "GPS Out", "Battery"
    ]);
  }
  return sheet;
}

function processAttendance(payload) {
  try {
    if (!payload || !payload.driverId) return { success: false, message: "Missing driver ID." };

    const sheet = getAttendanceSheet();
    const displayData = sheet.getDataRange().getDisplayValues();
    const rawData = sheet.getDataRange().getValues();

    const driverId = payload.driverId.toString().trim();
    const now = new Date();
    const today = formatYYYYMMDD(now);
    const timeNow = getCurrentTime();
    const epoch = now.getTime();
    const client = payload.clientName || "Fairdeal";
    
    const clientConfigMap = (typeof CLIENT_CONFIG !== 'undefined') ? CLIENT_CONFIG : {};
    const clientInfo = clientConfigMap[client] || { rate: 750, maxHours: 12 };

    let selfieURL = "";
    if (payload.selfieBase64) {
      selfieURL = uploadBase64Image(payload.selfieBase64, driverId + "_" + payload.type + "_" + epoch);
    }

    const searchDriverId = driverId.toLowerCase();

    if (payload.type === "IN") {
      for (let i = displayData.length - 1; i >= 1; i--) {
        const rowDriverId = (displayData[i][0] || "").toString().trim().toLowerCase();
        const rowTimeOut = (displayData[i][3] || "").toString().trim();
        if (rowDriverId === searchDriverId && (rowTimeOut === "" || rowTimeOut === "Pending")) {
          return { success: false, message: "Driver is currently on duty! Please Check-Out first." };
        }
      }

      sheet.appendRow([
        driverId, today, timeNow, "", "ACTIVE", clientInfo.rate, client, epoch, 0, 0, "", selfieURL, payload.gps || "", "", "", payload.battery || ""
      ]);

      return { success: true, message: "Check-In Successful!", time: timeNow, epoch: epoch };
    }

    if (payload.type === "OUT") {
      for (let i = displayData.length - 1; i >= 1; i--) {
        const rowDriverId = (displayData[i][0] || "").toString().trim().toLowerCase();
        const rowTimeOut = (displayData[i][3] || "").toString().trim();

        if (rowDriverId === searchDriverId && (rowTimeOut === "" || rowTimeOut === "Pending")) {
          let markInEpoch = Number(rawData[i][7]);
          if (isNaN(markInEpoch) || markInEpoch <= 0) markInEpoch = epoch - (1000 * 60 * 60);

          const workedHours = Math.max(0.01, (epoch - markInEpoch) / (1000 * 60 * 60));
          const payableHours = Math.min(workedHours, clientInfo.maxHours);
          const inc = Number(rawData[i][8]) || 0;
          const ded = Number(rawData[i][9]) || 0;
          const payout = Math.round((payableHours * (clientInfo.rate / clientInfo.maxHours)) + inc - ded);

          sheet.getRange(i + 1, 4).setValue(timeNow);
          sheet.getRange(i + 1, 5).setValue("COMPLETED");
          sheet.getRange(i + 1, 6).setValue(payout);
          sheet.getRange(i + 1, 14).setValue(selfieURL);
          sheet.getRange(i + 1, 15).setValue(payload.gps || "");

          return { success: true, message: "Check-Out Successful!", payout: payout, workedHours: workedHours.toFixed(2) };
        }
      }
      return { success: false, message: "No active shift found to Check-Out." };
    }
    return { success: false, message: "Invalid action." };
  } catch (err) {
    return { success: false, message: "Server Error: " + err.toString() };
  }
}

/**
 * Consolidated 7-Day (Weekly) Attendance Telemetry
 */
function getAttendanceData(driverId) {
  try {
    const sheet = getAttendanceSheet();
    const displayData = sheet.getDataRange().getDisplayValues();
    const rawData = sheet.getDataRange().getValues();

    if (!driverId) return { success: false, message: "Driver ID required." };

    const searchDriverId = driverId.toString().trim().toLowerCase();
    const clientConfigMap = (typeof CLIENT_CONFIG !== 'undefined') ? CLIENT_CONFIG : {};

    let dayMap = {};
    let activeShift = null;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    for (let i = displayData.length - 1; i >= 1; i--) {
      const rowDriverId = (displayData[i][0] || "").toString().trim().toLowerCase();

      if (rowDriverId === searchDriverId) {
        const dateStr = formatYYYYMMDD(rawData[i][1]);
        const shiftDate = new Date(dateStr);

        const timeInStr = (displayData[i][2] || "").trim();
        const timeOutStr = (displayData[i][3] || "").trim();
        const client = (displayData[i][6] || "Fairdeal").trim();
        const clientInfo = clientConfigMap[client] || { rate: 750, maxHours: 12 };

        const isCompleted = (timeOutStr !== "" && timeOutStr !== "Pending");
        const rawEpoch = Number(rawData[i][7]);

        let shiftDurationMs = 0;
        if (!isNaN(rawEpoch) && rawEpoch > 0) {
          let endMs = isCompleted ? new Date(dateStr + 'T' + timeOutStr).getTime() : Date.now();
          shiftDurationMs = Math.max(0, isNaN(endMs) ? 0 : endMs - rawEpoch);
        }

        let effectiveHours = Math.min(shiftDurationMs / (1000 * 60 * 60), clientInfo.maxHours);
        let shiftNetPayout = Math.round((effectiveHours * (clientInfo.rate / clientInfo.maxHours)) + (Number(rawData[i][8]) || 0) - (Number(rawData[i][9]) || 0));

        // DETECT ACTIVE SHIFT
        if (!isCompleted && !activeShift) {
          activeShift = {
            client: client,
            timeIn: timeInStr,
            markInEpoch: rawEpoch || Date.now(),
            rate: clientInfo.rate,
            maxHours: clientInfo.maxHours
          };
        }

        // Keep 7-day logs for attendance view
        if (shiftDate >= sevenDaysAgo) {
          if (!dayMap[dateStr]) {
            dayMap[dateStr] = { date: dateStr, client: client, totalDurationMs: 0, totalPayout: 0, hasActive: false };
          }
          dayMap[dateStr].totalDurationMs += shiftDurationMs;
          dayMap[dateStr].totalPayout += shiftNetPayout;
          if (!isCompleted) dayMap[dateStr].hasActive = true;
        }
      }
    }

    let consolidatedLogs = Object.keys(dayMap).map(dateKey => {
      const item = dayMap[dateKey];
      const hrs = Math.floor(item.totalDurationMs / (1000 * 60 * 60));
      const mins = Math.floor((item.totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        date: item.date,
        client: item.client,
        totalHoursStr: `${hrs}h ${mins}m`,
        netPayout: item.totalPayout,
        hasActive: item.hasActive
      };
    });

    consolidatedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      success: true,
      logs: consolidatedLogs,
      activeShift: activeShift
    };

  } catch(err) {
    return { success: false, message: err.toString() };
  }
}
