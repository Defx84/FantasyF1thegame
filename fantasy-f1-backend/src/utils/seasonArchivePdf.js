const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const LeagueLeaderboard = require('../models/LeagueLeaderboard');

// Helper to load your logo as a data URL (for embedding in HTML)
function getLogoDataUrl() {
  try {
    // Use the frontend email banner path
    const logoPath = path.join(__dirname, '../../../fantasy-f1-frontend/public/email-banner.png');
    
    if (fs.existsSync(logoPath)) {
      const logo = fs.readFileSync(logoPath);
      console.log(`[PDF Generation] Logo found at: ${logoPath}`);
      return `data:image/png;base64,${logo.toString('base64')}`;
    } else {
      console.warn(`[PDF Generation] Logo not found at: ${logoPath}`);
    }
  } catch (error) {
    console.warn('[PDF Generation] Error loading logo:', error.message);
  }
  return null; // Return null if logo doesn't exist
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
 * Generate championship progression chart as base64 image
 * @param {string} leagueId - League ID
 * @param {number} season - Season year
 * @param {string} type - 'driver' or 'team'
 * @returns {Promise<string|null>} - Base64 image data URL or null if error
 */
async function generateChampionshipChartImage(leagueId, season, type = 'driver') {
  try {
    // Get championship progression data (same logic as controller)
    const leaderboard = await LeagueLeaderboard.findOne({
      league: leagueId,
      season: season
    }).populate('driverStandings.user constructorStandings.user', 'username');

    if (!leaderboard) {
      return null;
    }

    // Get all unique rounds
    const allRounds = new Set();
    leaderboard.driverStandings.forEach(standing => {
      standing.raceResults.forEach(result => {
        allRounds.add(result.round);
      });
    });
    const rounds = Array.from(allRounds).sort((a, b) => a - b);

    // Get standings based on type
    const standings = type === 'driver' ? leaderboard.driverStandings : leaderboard.constructorStandings;
    
    // Calculate progression data
    const players = standings.map(standing => {
      const cumulativePoints = [];
      let runningTotal = 0;
      rounds.forEach(round => {
        const result = standing.raceResults.find(r => r.round === round);
        if (result) {
          const points = type === 'driver' 
            ? (result.mainRacePoints || 0) + (result.sprintPoints || 0)
            : (result.totalPoints || 0);
          runningTotal += points;
        }
        cumulativePoints.push(runningTotal);
      });
      return {
        username: standing.username || (standing.user?.username || 'Unknown'),
        points: cumulativePoints
      };
    });

    if (players.length === 0 || rounds.length === 0) {
      return null;
    }

    // Color palette (same as frontend)
    const PLAYER_COLORS = [
      '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
      '#14B8A6', '#F43F5E', '#A855F7', '#22C55E', '#EAB308'
    ];

    // Create HTML with Chart.js to render the chart
    const chartData = rounds.map((round, idx) => {
      const dataPoint = { round };
      players.forEach((player, playerIdx) => {
        dataPoint[`player_${playerIdx}`] = player.points[idx] || 0;
      });
      return dataPoint;
    });

    const datasets = players.map((player, idx) => ({
      label: player.username,
      data: player.points,
      borderColor: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] + '20',
      tension: 0.4,
      fill: false
    }));

    const chartHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
          <style>
            body { margin: 0; padding: 20px; background: white; }
            #chartContainer { width: 800px; height: 400px; }
          </style>
        </head>
        <body>
          <div id="chartContainer">
            <canvas id="chart"></canvas>
          </div>
          <script>
            const ctx = document.getElementById('chart').getContext('2d');
            const chart = new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(rounds.map(r => `Round ${r}`))},
                datasets: ${JSON.stringify(datasets)}
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Championship Progression - ${type === 'driver' ? 'Driver' : 'Team'} Championship',
                    font: { size: 16, weight: 'bold' }
                  },
                  legend: {
                    display: true,
                    position: 'right'
                  }
                },
                scales: {
                  x: {
                    title: { display: true, text: 'Round' }
                  },
                  y: {
                    title: { display: true, text: 'Cumulative Points' },
                    beginAtZero: true
                  }
                }
              }
            });
          </script>
        </body>
      </html>
    `;

    // Render chart with Puppeteer and capture as image
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      const os = require('os');
      const platform = os.platform();
      const possiblePaths = {
        win32: [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
        ],
        darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
        linux: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
      };
      const paths = possiblePaths[platform] || possiblePaths.linux;
      for (const chromePath of paths) {
        if (fs.existsSync(chromePath)) {
          executablePath = chromePath;
          break;
        }
      }
    }

    const launchOptions = executablePath ? { executablePath } : {};
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 450 });
    await page.setContent(chartHtml, { waitUntil: 'networkidle0' });
    
    // Wait for chart to render
    await page.waitForTimeout(1000);
    
    // Capture chart as image
    const imageBuffer = await page.screenshot({ 
      type: 'png',
      clip: { x: 0, y: 0, width: 800, height: 400 }
    });
    
    await browser.close();
    
    // Convert to base64
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('[PDF Generation] Error generating chart:', error);
    return null;
  }
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
  
  // Generate championship progression charts
  console.log('[PDF Generation] Generating championship progression charts...');
  const driverChartImage = await generateChampionshipChartImage(league._id.toString(), league.season, 'driver');
  const teamChartImage = await generateChampionshipChartImage(league._id.toString(), league.season, 'team');
  
  // 1. Build HTML string with all your data
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1, h2, h3 { color: #d32f2f; }
          .cover { text-align: center; margin-bottom: 40px; }
          .logo { width: 300px; max-width: 100%; margin-bottom: 20px; height: auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="cover">
          ${getLogoDataUrl() ? `<img src="${getLogoDataUrl()}" class="logo" />` : ''}
          <h1>${league.name} - Season ${league.season}</h1>
          <h3>Owner: ${league.owner?.username || ''}</h3>
          <h3>Members: ${league.members.map(m => m.username).join(', ')}</h3>
        </div>
        <h2>Table of Contents</h2>
        <ol>
          <li>Final Standings</li>
          <li>Championship Progression Charts</li>
        </ol>
        <!-- Final Standings Section -->
        <h2>Final Standings</h2>
        ${renderStandingsTable('Driver Standings', standings?.driverStandings || [])}
        ${renderStandingsTable('Constructor Standings', standings?.constructorStandings || [])}
        <!-- Championship Progression Charts Section -->
        <h2>Championship Progression Charts</h2>
        ${driverChartImage ? `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3>Driver Championship Progression</h3>
            <img src="${driverChartImage}" style="width: 100%; max-width: 800px; height: auto;" />
          </div>
        ` : '<p>Driver championship chart not available.</p>'}
        ${teamChartImage ? `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3>Team Championship Progression</h3>
            <img src="${teamChartImage}" style="width: 100%; max-width: 800px; height: auto;" />
          </div>
        ` : '<p>Team championship chart not available.</p>'}
      </body>
    </html>
  `;

  // 2. Use puppeteer to render HTML to PDF
  // Try to find Chrome/Chromium executable
  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!executablePath) {
    // Common Chrome paths on different platforms
    const os = require('os');
    const platform = os.platform();
    const possiblePaths = {
      win32: [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ],
      darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
      linux: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
    };
    
    const paths = possiblePaths[platform] || possiblePaths.linux;
    for (const chromePath of paths) {
      if (fs.existsSync(chromePath)) {
        executablePath = chromePath;
        break;
      }
    }
    
    // Fallback: let puppeteer use its bundled Chromium
    if (!executablePath) {
      console.warn('[PDF Generation] Chrome/Chromium not found in common paths, trying puppeteer bundled browser...');
    }
  }
  
  const launchOptions = executablePath ? { executablePath } : {};
  const browser = await puppeteer.launch(launchOptions);
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