async function scrapeMotorsportResultsByType(slug, type = 'RACE') {
  try {
    const url = `https://www.motorsport.com/f1/results/${slug}/?st=${type === 'SPRINT' ? 'SPR' : 'RAC'}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const results = [];
    const teamResults = new Map();

    // Scrape driver results
    $('.ms-table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      const position = $(cells[1]).text().trim();
      const driver = $(cells[2]).text().trim();
      const team = $(cells[3]).text().trim();
      const laps = $(cells[4]).text().trim();
      const time = $(cells[5]).text().trim();
      const points = parseInt($(cells[cells.length - 1]).text().trim()) || 0;

      // Add to results
      results.push({
        driver,
        team,
        position: position.toLowerCase(), // Keep as string for DNF/DNS/DSQ
        points,
        laps,
        time
      });

      // Accumulate team points
      const currentTeamPoints = teamResults.get(team) || 0;
      teamResults.set(team, currentTeamPoints + points);
    });

    // Convert team results to array
    const teamResultsArray = Array.from(teamResults.entries()).map(([team, points]) => ({
      team,
      points
    }));

    return {
      results,
      teamResults: teamResultsArray
    };
  } catch (error) {
    console.error(`Error scraping ${type} results for ${slug}:`, error);
    throw error;
  }
}

module.exports = {
  scrapeMotorsportResultsByType
}; 