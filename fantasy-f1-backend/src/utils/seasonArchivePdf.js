const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Helper to load your logo as a data URL (for embedding in HTML)
function getLogoDataUrl() {
  const logoPath = path.join(__dirname, '../public/logo.png'); // Adjust path as needed
  const logo = fs.readFileSync(logoPath);
  return `data:image/png;base64,${logo.toString('base64')}`;
}

function renderStandingsTable(title, standings, type = 'driver') {
  if (!standings || !Array.isArray(standings) || standings.length === 0) return '<p>No data available.</p>';
  return `
    <h3>${title}</h3>
    <table>
      <tr>
        <th>Position</th>
        <th>User</th>
        <th>Total Points</th>
      </tr>
      ${standings.map((s, i) => `
        <tr${i === 0 ? ' style="background:#ffe082;font-weight:bold;"' : ''}>
          <td>${i + 1}</td>
          <td>${s.user?.username || '-'}</td>
          <td>${s.totalPoints}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function renderRaceBreakdown(races, raceSelections, leagueMembers) {
  if (!races || races.length === 0) return '<p>No races found.</p>';
  return races.map(race => {
    // Get selections for this race
    const selections = raceSelections.filter(sel => sel.round === race.round);
    return `
      <h4>Round ${race.round}: ${race.raceName} (${race.circuit}, ${new Date(race.date).toLocaleDateString()})</h4>
      <table>
        <tr>
          <th>User</th>
          <th>Main Driver</th>
          <th>Reserve Driver</th>
          <th>Team</th>
          <th>Points</th>
        </tr>
        ${leagueMembers.map(member => {
          const sel = selections.find(s => s.user.toString() === member._id.toString());
          return `<tr>
            <td>${member.username}</td>
            <td>${sel?.mainDriver || '-'}</td>
            <td>${sel?.reserveDriver || '-'}</td>
            <td>${sel?.team || '-'}</td>
            <td>${sel?.points ?? '-'}</td>
          </tr>`;
        }).join('')}
      </table>
    `;
  }).join('');
}

function renderStatsSection(stats) {
  let html = '';
  if (stats.highestSingleRace) {
    html += `<p><b>Highest Single-Race Score:</b> ${stats.highestSingleRace.user} (${stats.highestSingleRace.points} pts in ${stats.highestSingleRace.race})</p>`;
  }
  if (stats.mostImproved) {
    html += `<p><b>Most Improved Player:</b> ${stats.mostImproved.user} (from ${stats.mostImproved.from} to ${stats.mostImproved.to} pts, improvement: ${stats.mostImproved.improvement})</p>`;
  }
  return html || '<p>No stats available.</p>';
}

/**
 * Generate a season archive PDF for a league
 * @param {Object} league - League object (with name, season, members, owner)
 * @param {Object} seasonData - { standings, races, raceSelections, stats }
 * @param {string|null} outputPath - Optional path to save the PDF
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateSeasonArchivePdf(league, seasonData, outputPath = null) {
  const { standings, races, raceSelections, stats } = seasonData;
  // 1. Build HTML string with all your data
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1, h2, h3 { color: #d32f2f; }
          .cover { text-align: center; margin-bottom: 40px; }
          .logo { width: 120px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="cover">
          <img src="${getLogoDataUrl()}" class="logo" />
          <h1>${league.name} - Season ${league.season}</h1>
          <h3>Owner: ${league.owner?.username || ''}</h3>
          <h3>Members: ${league.members.map(m => m.username).join(', ')}</h3>
        </div>
        <h2>Table of Contents</h2>
        <ol>
          <li>Final Standings</li>
          <li>Race-by-Race Breakdown</li>
          <li>Stats & Fun Facts</li>
        </ol>
        <!-- Final Standings Section -->
        <h2>Final Standings</h2>
        ${renderStandingsTable('Driver Standings', standings?.driverStandings || [])}
        ${renderStandingsTable('Constructor Standings', standings?.constructorStandings || [])}
        <!-- Race-by-Race Breakdown Section -->
        <h2>Race-by-Race Breakdown</h2>
        ${renderRaceBreakdown(races, raceSelections, league.members)}
        <!-- Stats & Fun Facts Section -->
        <h2>Stats & Fun Facts</h2>
        ${renderStatsSection(stats)}
      </body>
    </html>
  `;

  // 2. Use puppeteer to render HTML to PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4' });

  await browser.close();

  // Optionally save to disk
  if (outputPath) {
    fs.writeFileSync(outputPath, pdfBuffer);
  }

  return pdfBuffer;
}

module.exports = { generateSeasonArchivePdf }; 