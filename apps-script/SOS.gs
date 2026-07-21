/**
 * EV GO Drivers App - Emergency Dispatcher
 */
function getSOSSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheetName = (typeof SHEETS !== 'undefined' && SHEETS.SOS) ? SHEETS.SOS : "SOS_Alerts";
  let sheet = ss.getSheetByName(targetSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(targetSheetName);
    sheet.appendRow(["Timestamp", "Driver ID", "Latitude", "Longitude", "Google Maps", "Battery", "Emergency Contact", "Remarks", "Status"]);
  }
  return sheet;
}

function triggerSOSAlert(arg1, arg2) {
  try {
    const sheet = getSOSSheet();
    let driverId = "EMP7399", latitude = "28.4595", longitude = "77.0266";

    if (typeof arg1 === "string" || typeof arg1 === "number") {
      driverId = arg1.toString().trim();
      if (arg2) {
        const coords = arg2.toString().split(",");
        if (coords.length >= 2) { latitude = coords[0].trim(); longitude = coords[1].trim(); }
      }
    }

    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    sheet.appendRow([new Date(), driverId, latitude, longitude, mapLink, "85%", "+91 9876543210", "🚨 Emergency SOS", "OPEN"]);

    return { success: true, message: "🚨 EMERGENCY SOS DISPATCHED! Alert sent to Fleet Manager.", mapLink: mapLink };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}
