const assert = require('assert');
const t = require('../index');

describe('retrieveRss', function () {
  it('retrieves rss', async function () {
    return t.retrieveRss().then(data => {
      assert.ok(data);
      assert(data.rss);
      assert(data.rss.channel);
      assert(data.rss.channel.length);
      const items = data.rss.channel[0].item;
      assert(items);
      assert(items.length);
      const item = items[0];
      assert(item.title);
      assert(item.link);
    })
  })
});

describe('RssItem', function () {
  it('revive()', function () {
    const json = {
      "title": ["Spider-Man (PS4) $39.99 eBay"],
      "link": ["https://www.cheapassgamer.com/topic/368871-spider-man-ps4-3999-ebay/"],
      "description": ["<p><a href=\"http://rover.ebay.com/rover/1/711-53200-19255-0/1?ff3=4&pub=5574630571&toolid=10001&campid=5335816987&customid=&mpre=https%3A//www.ebay.com/itm/Marvel-s-Spider-Man-PlayStation-4-Brand-New/183421434973%3Fepid%3D223403937%26hash%3Ditem2ab4c4fc5d:g:3tsAAOSwJK9bkqxC:rk:2:pf:0\" class='bbc_url' title='External link' rel='nofollow external'>https://www.ebay.com/itm/Marvel-s-Spider-Man-PlayStation-4-Brand-New/183421434973?epid=223403937&hash=item2ab4c4fc5d:g:3tsAAOSwJK9bkqxC:rk:2:pf:0</a></p>\n"],
      "pubDate": ["Fri, 30 Nov 2018 16:40:54 +0000"],
      "guid": [{
        "_": "https://www.cheapassgamer.com/topic/368871-spider-man-ps4-3999-ebay/",
        "$": {
          "isPermaLink": "false"
        }
      }]
    };

    const test = t.RssItem.revive(json);
    assert.ok(test);
    assert.strictEqual(test.title, 'Spider-Man (PS4) $39.99 eBay');
    assert.strictEqual(test.link, 'https://www.cheapassgamer.com/topic/368871-spider-man-ps4-3999-ebay/');
    assert.strictEqual(test.description, "<p><a href=\"http://rover.ebay.com/rover/1/711-53200-19255-0/1?ff3=4&pub=5574630571&toolid=10001&campid=5335816987&customid=&mpre=https%3A//www.ebay.com/itm/Marvel-s-Spider-Man-PlayStation-4-Brand-New/183421434973%3Fepid%3D223403937%26hash%3Ditem2ab4c4fc5d:g:3tsAAOSwJK9bkqxC:rk:2:pf:0\" class='bbc_url' title='External link' rel='nofollow external'>https://www.ebay.com/itm/Marvel-s-Spider-Man-PlayStation-4-Brand-New/183421434973?epid=223403937&hash=item2ab4c4fc5d:g:3tsAAOSwJK9bkqxC:rk:2:pf:0</a></p>\n");
    assert.strictEqual(test.pubDate, 'Fri, 30 Nov 2018 16:40:54 +0000');
    assert.strictEqual(test.guid, 'https://www.cheapassgamer.com/topic/368871-spider-man-ps4-3999-ebay/');
    assert.strictEqual(test.isPermaLink, false);
  })
});

describe('simplifyTerm', function () {
  it('doesn\'t change a simple term', function () {
    assert.equal('foo', t.simplifyTerm('foo'));
  });

  it('trims spaces', function () {
    assert.equal('foo', t.simplifyTerm('  foo   '));
  });

  it('replaces lower cases', function () {
    assert.equal('ps4', t.simplifyTerm('PS4'));
  });

})

describe('processData', function () {
  it('processData', function () {
    const testData = require('./rss.json');
    const deals = t.processData(testData, ['TheC64 Mini', 'Spiderman PS4']);
    assert.ok(deals);
    assert.equal(deals.length, 2);
  });
});

describe('generateDealText', function () {
  it('generates text', function () {
    const deal = new t.RssItem({
      title: 'PS4 on sale!',
      link: 'http://foo.com',
    });
    const test = t.generateDealText(deal);
    assert(test.includes(deal.title));
    assert(test.includes(deal.link));
  })
})

describe('GameDeals', function () {
  it('#run()', function () {
    const app = buildApp();
    return app.run().then(signal => {
      assert.ok(signal);
    });
  });

  it('doesn\'t repeat deals', async function () {
    const app = buildApp();
    return app.run().then(async () => {
      return app.run().then(signal => {
        console.log(JSON.stringify(signal));
        assert(null === signal);
      });
    })
  });

  it('gracefully handles bad config', async function () {
    const app = buildApp({});
    return app.run().then(async () => {
      return app.run().then(signal => {
        console.log('I\'m good');
      });
    })
  })
});

function buildApp(config) {
  const app = new t.GameDeals();
  app.config = config || {
    searchTerms: ['game'],
    geometry: {
      width: 1,
      height: 1,
    }
  };

  return app;
}