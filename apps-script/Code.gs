/**
 * EV GO Drivers App - Main Router
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('EV GO Drivers App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
