const algoliasearch = require('algoliasearch');
const gql = require('graphql-tag');
const apollo = require('../graphql/query');
const { buildSections, boostResult } = require('./helpers');
const { ALGOLIA_APPID, ALGOLIA_API_KEY } = require('../../env');

const { log } = console;

const client = algoliasearch(ALGOLIA_APPID, ALGOLIA_API_KEY);

const query = message => (gql`
  query {
      content(input:{ id: ${message.id}, status: any }) {
        id
        type
        created
        published
        unpublished
        updated
        status
        websiteSchedules { section { hierarchy { fullName } }}
        primaryImage { name filePath fileName src isLogo }
        primarySite{ host }
        name
        teaser
        body
      }
  }
`);

const upsertToIndex = async (message) => {
  log(`Proccessing: ${message.id}`);
  const c = await apollo.queryFromBase(query(message), message.tenant);
  const content = c.content;

  c.content.boost = boostResult(content);

  // Removed HTML tags
  if (content.body) {
    content.body = content.body.replace(/(<([^>]+)>)/gi, "");
    content.body = content.body.substring(0, Math.min(content.body.length, 30000));
  }

  // Set unpublished date to 100 years in the future if it's null
  if (!content.unpublished) {
    content.unpublished = 4753607469000;
  }

  if (content.websiteSchedules) {
    const sections = buildSections(content)
    delete content.websiteSchedules;
  }

  const index = client.initIndex(message.tenant);

  await index.saveObject({
    objectID: content.id,
    sections,
    ...content,
  });
};

module.exports = { upsertToIndex };
