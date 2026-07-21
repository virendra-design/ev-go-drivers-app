/**
 * EV GO Drivers App - Notification Center
 */
function getNotificationSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheetName = (typeof SHEETS !== 'undefined' && SHEETS.NOTIFICATION) ? SHEETS.NOTIFICATION : "Notifications";
  let sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
    sheet.appendRow(["ID", "Driver ID", "Title", "Message", "Type", "Created On", "Status"]);
    sheet.appendRow([1, "ALL", "Welcome to EV GO", "Welcome to the EV GO Drivers App.", "info", new Date(), "Unread"]);
  }
  return sheet;
}

function getDriverNotifications(driverId) {
  try {
    const sheet = getNotificationSheet();
    const data = sheet.getDataRange().getValues();
    const searchDriverId = (driverId || "").toString().trim().toLowerCase();
    let notifications = [];

    for (let i = data.length - 1; i >= 1; i--) {
      const targetDriver = (data[i][1] || "").toString().trim().toLowerCase();
      if (targetDriver === "all" || targetDriver === searchDriverId || searchDriverId === "") {
        notifications.push({
          id: data[i][0],
          title: data[i][2] || "Notification",
          message: data[i][3] || "",
          type: data[i][4] || "info",
          time: "Recently",
          status: data[i][6] || "Unread"
        });
      }
    }
    return { success: true, notifications: notifications };
  } catch (err) {
    return { success: false, notifications: [] };
  }
}
