// Build out the sections and remove duplicates.
// Example: toplevel > secondlevel > thirdlevel
const buildSections = (c) => {
  // Get the values of the seconds
  const sections = c.websiteSchedules.map(s => (s.section.hierarchy.map(n => n.fullName)));
  // flatten the array and remove duplicates.
  const sectionsNames = [...new Set([].concat(...sections))];
  // format and build out section structure
  return sectionsNames.reduce((obj, name) => {
    const number = [name.split('>').length - 1];
    const key = `lev${number}`;
    const values = obj[key] || [];

    // if on level 3 and more than 100 sections don't include them
    if (number >= 2 && sectionsNames.length > 100) {
      return obj;
    }

    return { ...obj, [key]: [...values, name] };
  }, {});
};

// Slightly boost companies and maybe others later
const boostResult = (node) => {
  if (node.type === 'company') {
    return 1;
  }
  return 0;
};

// Formats the object for Algolia's bulk update
const buildObj = (nodes, tenant) => nodes.map((node) => {
  const content = node;
  if (content.websiteSchedules) {
    content.sections = buildSections(content)
    delete content.websiteSchedules;
  }

  // Removed HTML tags
  if (content.body) {
    content.body = content.body.replace(/(<([^>]+)>)/gi, "");
    content.body = content.body.substring(0, Math.min(content.body.length, 30000));
  }

  // Set unpublished date 100 years into the future.
  if (!content.unpublished) {
    content.unpublished = 4753607469000;
  }
  return {
    action: 'updateObject',
    indexName: tenant,
    body: {
      objectID: content.id,
      sections: content.sections,
      ...content,
      boost: boostResult(content),
    },
  };
});

module.exports = {
  buildObj,
  buildSections,
  boostResult,
};
