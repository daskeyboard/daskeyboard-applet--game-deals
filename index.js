const fs = require('fs');
const {
  parseString
} = require('xml2js');
const request = require('request-promise');
const q = require('daskeyboard-applet');
const logger = q.logger;

/**
 * Retrieve RSS XML from the service
 */
async function retrieveRss() {
  const url = 'https://www.cheapassgamer.com/rss/forums/1-cheap-ass-gamer-video-game-deals-forum/';
  logger.info("Getting RSS via URL: " + url);
  return request.get({
    url: url,
    json: false
  }).then(async body => {
    return new Promise((resolve, reject) => {
      parseString(body, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });
}

class RssItem {
  constructor({
    title,
    link,
    description,
    pubDate,
    guid,
    isPermaLink
  }) {
    this.title = title;
    this.link = link;
    this.description = description;
    this.pubDate = pubDate;
    this.guid = guid;
    this.isPermaLink = isPermaLink;
  }
}
RssItem.revive = function (json) {
  return new RssItem({
    title: json.title[0],
    link: json.link[0],
    description: json.description[0],
    pubDate: json.pubDate[0],
    guid: json.guid[0]['_'],
    isPermaLink: json.guid[0]['$'].isPermaLink === 'true',
  })
}

/**
 * Simplifies a term for easier comparison
 * @param {String} term 
 */
function simplifyTerm(term) {
  if (typeof term === 'string') {
    return term.trim().replace(/[^\w\d\s]/, '').replace(/\s+/, ' ').toLowerCase();
  } else if (typeof term === 'number') {
    return term;
  } else {
    return term || '';
  }
}

/**
 * Process raw JSON into deals
 * @param {String} data 
 */
function processData(data, searchTerms) {
  const items = data.rss.channel[0].item;
  const deals = [];
  for (let json of items) {
    const item = RssItem.revive(json);
    const simplified = {
      ...item
    };
    simplified.title = simplifyTerm(simplified.title);
    simplified.description = simplifyTerm(simplified.description);

    for (let i = 0; i < searchTerms.length; i += 1) {
      searchTerms[i] = simplifyTerm(searchTerms[i]);
    }

    for (let searchTerm of searchTerms) {
      if (simplified.title.includes(searchTerm) || simplified.description.includes(searchTerm)) {
        logger.info(`Found deal matching: ${searchTerm}`);
        deals.push(item);
        break;
      }
    }
  }

  return deals;
}

/**
 * Generate the signal text for a given deal
 * @param {RssItem} deal 
 */
function generateDealText(deal) {
  return (`${deal.title}\n${deal.link}\n`);
}


class GameDeals extends q.DesktopApp {
  constructor() {
    super();
    // store a record of previously notified deals
    this.dealsNotified = {};
    this.pollingInterval = 5 * 60 * 1000; // ms
  }

  /**
   * Generate a signal from deal RSS
   * @param {Array<RssItem>} deals
   */
  generateSignal(deals) {
    const messages = [];

    for (let deal of deals) {
      if (!this.dealsNotified[deal.guid]) {
        messages.push(generateDealText(deal));
        messages.push("\n");
        this.dealsNotified[deal.guid] = true;
      }
    }

    if (messages.length) {
      return new q.Signal({
        points: [
          [
            new q.Point('#00FF00')
          ]
        ],
        name: `New Game Deal!`,
        message: messages.join("\n"),
        link: {
          url: deals[0].link,
          label: 'See this deal',
        }
      });
    } else {
      return null;
    }
  }

  async run() {
    logger.info("Running.");
    const searchTerms = this.config.searchTerms;

    if (searchTerms) {
      logger.info("My search terms are: " + JSON.stringify(searchTerms));

      return retrieveRss()
        .then(body => {
          return processData(body, searchTerms);
        })
        .then(deals => {
          return this.generateSignal(deals);
        })
    } else {
      logger.warn("No searchTerms configured.");
      return null;
    }
  }
}


module.exports = {
  RssItem: RssItem,
  GameDeals: GameDeals,

  generateDealText: generateDealText,
  processData: processData,
  retrieveRss: retrieveRss,
  simplifyTerm: simplifyTerm,
}

const applet = new GameDeals();