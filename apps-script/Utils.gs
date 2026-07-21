/**
 * EV GO Drivers App - Shared Constants & Helpers
 */
const SHEETS = {
  EMPLOYEES: "Employees",
  ATTENDANCE: "Attendance",
  NOTIFICATION: "Notifications",
  SOS: "SOS_Alerts"
};

const DRIVE_FOLDER = "EV GO Driver Selfies";

const CLIENT_CONFIG = {
  Fairdeal: { rate: 750, maxHours: 12 },
  Amazon: { rate: 850, maxHours: 14 },
  "Delhivery Limited": { rate: 800, maxHours: 10 },
  "Delhivery Direct": { rate: 750, maxHours: 10 },
  Flipkart: { rate: 800, maxHours: 12 },
  Shadowfax: { rate: 700, maxHours: 10 }
};

function formatYYYYMMDD(date) {
  if (!date) return "";
  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return "";
      return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    const str = date.toString().trim();
    if (str.includes("T")) return str.split("T")[0];
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }
    return str;
  } catch (e) {
    return "";
  }
}

function getCurrentTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss");
}

function getCurrentTimestamp() {
  return new Date().getTime();
}

function getDriveFolder(folderName) {
  try {
    const name = folderName || DRIVE_FOLDER;
    const folders = DriveApp.getFoldersByName(name);
    if (folders.hasNext()) return folders.next();
    return DriveApp.createFolder(name);
  } catch (e) {
    return null;
  }
}

function uploadBase64Image(base64, fileName, targetFolder) {
  if (!base64 || typeof base64 !== "string" || !base64.includes(";base64,")) return "";
  try {
    const folder = targetFolder || getDriveFolder(DRIVE_FOLDER);
    if (!folder) return "";
    const contentType = base64.substring(5, base64.indexOf(";base64"));
    const bytes = Utilities.base64Decode(base64.split(";base64,")[1]);
    const blob = Utilities.newBlob(bytes, contentType, (fileName || "Doc_" + getCurrentTimestamp()) + ".jpg");
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "";
  }
}
