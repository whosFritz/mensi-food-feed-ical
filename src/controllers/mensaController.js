// controllers/mensaController.js
const logger = require('../config/logger');
const { mensaMap } = require('../services/mensaService');
const { getIcs } = require('../services/icalService');

const getMensaIcal = async (req, res, db) => {
  try {
    const mensaID = req.params.mensaID;
    if (!mensaMap[mensaID]) {
      logger.error('Mensa ID not found:', mensaID);
      return res.status(404).send('Mensa ID not found');
    }
    
    const mensaName = mensaMap[mensaID];
    const collection = db.collection(`mensa_${mensaID}`);
    const meals = await collection.find({}).toArray();

    const icsContent = await getIcs(meals, req.url, mensaName);
    logger.info(`Sending iCal content for ${mensaName} (ID: ${mensaID})`);
    res.setHeader('Content-Disposition', 'attachment; filename=calendar.ics');
    res.setHeader('Content-Type', 'text/calendar');
    res.send(icsContent);
  } catch (error) {
    logger.error('Error sending iCal content:', error);
    res.status(500).send('Internal Server Error');
  }
};

const getAllMensaUrls = (req, res) => {
  const calendarUrls = Object.keys(mensaMap).map(id => {
    const calendarUrl = `webcal://${req.headers.host}/foodfeed/${id}`;
    return `<p>${mensaMap[id]}: <a href="${calendarUrl}">${calendarUrl}</a></p>`;
  }).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mensi Food Feed iCal</title>
    </head>
    <body>
      <h1>Mensi Food Feed iCal</h1>
      <p>Click on these URLs to subscribe to the calendar feeds:</p>
      ${calendarUrls}
      <p>Author: whosfritz</p>
      <p>Source: <a href="https://github.com/whosFritz/mensi-food-feed-ical">GitHub</a></p>
    </body>
    </html>
  `);
};

module.exports = {
  getMensaIcal,
  getAllMensaUrls
};
