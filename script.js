let currentScene = 1;

document.addEventListener("DOMContentLoaded", function () {
  showScene(currentScene);

  d3.select("#next").on("click", () => {
    if (currentScene < 7) {
      currentScene++;
      showScene(currentScene);
    }
  });

  d3.select("#prev").on("click", () => {
    if (currentScene > 1) {
      currentScene--;
      showScene(currentScene);
    }
  });
});

function showScene(sceneNum) {
  d3.select("#viz-container").selectAll("*").remove();
  d3.select("#scene-text").text("");

  if (sceneNum === 1) {
    drawScene1ChartA();
    d3.select("#scene-text").text("3PA per game has increased across all five positions, especially among bigs (PF/C).");
  }

  if (sceneNum === 2) {
    drawScene1ChartB();
    d3.select("#scene-text").text("Guards and forwards still lead in 3PA, but bigs are rapidly catching up. Everyone shoots now.");
  }

  if (sceneNum === 3) {
    drawScene1ChartC();
    d3.select("#scene-text").text("League-wide shift: Annotated tipping points in 3-point revolution.");
  }

  if (sceneNum === 4) {
    drawPaceVs3PAScatter(); // scene 2 chart c
    d3.select("#scene-text").text("Pace-and-space revolution: faster play, more threes in the 2010s and 2020s.");
  }

  if (sceneNum === 5) {
    drawScene2ChartB();
    d3.select("#scene-text").text("Roles are blending: guards rebound, bigs assist, and everyone uses possessions. Stats are converging.");
  }

  if (sceneNum === 6) {
    drawScene2ChartA();
    d3.select("#scene-text").text("Players are playing more positions over time — the era of positionless basketball is here.");
  }

  if (sceneNum === 7) {
    drawLeBronProfile();
    d3.select("#scene-text").text("LeBron James is one of the best examples of the modern positionless NBA.");
  }
}


// Scene 1 Chart A
function drawScene1ChartA() {
  d3.csv("data/Player Per Game Adjusted.csv").then(data => {
    const positions = ["PG", "SG", "SF", "PF", "C"];
    data.forEach(d => {
      d.season = +d.season;
      d.x3pa_per_game = +d.x3pa_per_game;
    });

    const filtered = data.filter(d =>
      d.pos && !isNaN(d.x3pa_per_game) &&
      positions.some(pos => d.pos.includes(pos))
    );

    const lines = positions.map(pos => ({
      pos,
      values: d3.range(1980, 2026).map(season => {
        const group = filtered.filter(d => d.season === season && d.pos.includes(pos));
        return {
          season,
          avg: d3.mean(group, d => d.x3pa_per_game) ?? 0
        };
      })
    }));

    drawLineChart(lines, positions, "Average 3PA per Game by Position (≥ 12 MPG)");
  });
}

// Scene 1 Chart B
function drawScene1ChartB() {
  d3.csv("data/Player Per Game Adjusted.csv").then(data => {
    const roles = ["G", "F", "Big"];
    data.forEach(d => {
      d.season = +d.season;
      d.x3pa_per_game = +d.x3pa_per_game;
    });

    const filtered = data.filter(d => d.pos && !isNaN(d.x3pa_per_game));

    const lines = roles.map(role => ({
      pos: role,
      values: d3.range(1980, 2026).map(season => {
        let group = filtered.filter(d => d.season === season);

        if (role === "G") {
          group = group.filter(d => d.pos.includes("PG") || d.pos.includes("SG"));
        } else if (role === "F") {
          group = group.filter(d => d.pos.includes("SF") || d.pos.includes("PF"));
        } else if (role === "Big") {
          group = group.filter(d => d.pos.includes("PF") || d.pos.includes("C"));
        }

        return {
          season,
          avg: d3.mean(group, d => d.x3pa_per_game) ?? 0
        };
      })
    }));

    drawLineChart(lines, roles, "Grouped 3PA Trends: Guards, Forwards, Bigs");
  });
}

// Scene 1 Chart C (Annotated)
function drawScene1ChartC() {
  d3.csv("data/Player Per Game Adjusted.csv").then(data => {
    data.forEach(d => {
      d.season = +d.season;
      d.x3pa_per_game = +d.x3pa_per_game;
    });

    const filtered = data.filter(d => !isNaN(d.x3pa_per_game));

    const lineData = {
      pos: "All",
      values: d3.range(1980, 2026).map(season => ({
        season,
        avg: d3.mean(filtered.filter(d => d.season === season), d => d.x3pa_per_game) ?? 0
      }))
    };

    drawLineChart([lineData], ["All"], "All Players: Avg 3PA per Game (Annotated)", true);
  });
}

// Shared line chart function (for 3PA and similar)
function drawLineChart(lines, domainLabels, chartTitle, annotated = false) {
  const width = 900, height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleLinear()
    .domain([1980, 2025])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(lines.flatMap(d => d.values.map(v => v.avg)))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(domainLabels)
    .range(d3.schemeSet2.concat(d3.schemeSet1));

  const line = d3.line()
    .x(d => xScale(d.season))
    .y(d => yScale(d.avg));

  lines.forEach(lineData => {
    svg.append("path")
      .datum(lineData.values)
      .attr("fill", "none")
      .attr("stroke", color(lineData.pos))
      .attr("stroke-width", 2.5)
      .attr("d", line);

    const last = lineData.values[lineData.values.length - 1];
    svg.append("text")
      .attr("x", xScale(last.season) + 5)
      .attr("y", yScale(last.avg))
      .style("fill", color(lineData.pos))
      .style("font-size", "12px")
      .text(lineData.pos);
  });

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(chartTitle);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("season");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("3PA per Game");

  if (annotated) {
    const annotationData = [
      { season: 1994, label: "1994: Shortened line → spike in 3PA" },
      { season: 2004, label: "2004: Suns' '7 Seconds or Less' offense" },
      { season: 2007, label: "2007: Rockets analytics era begins" },
      { season: 2015, label: "2015: Curry motion-offense explosion" },
      { season: 2025, label: "2025: All teams >32 3PA/game" }
    ];

    const allLine = lines.find(l => l.pos === "All");
    const annotations = annotationData.map(a => ({
      note: { label: a.label, align: "left" },
      x: xScale(a.season),
      y: yScale(allLine.values.find(v => v.season === a.season).avg),
      dx: 10, dy: -30
    }));

    const makeAnnotations = d3.annotation().annotations(annotations);
    svg.append("g").attr("class", "annotation-group").call(makeAnnotations);
  }
}

function drawLineChart2(data) {
  // Filter data to 1997 and beyond
  const filteredData = data.filter(d => d.year >= 1997);

  // Convert fields to numbers
  filteredData.forEach(d => {
    d.year = +d.year;
    d.avg_pos = +d.avg_pos;
    d.sd_pos = +d.sd_pos;
  });

  

  // Set up dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  // Remove previous chart if it exists
  d3.select("#chart2").selectAll("*").remove();

  const svg = d3.select("#chart2")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // X scale (year)
  const xScale = d3.scaleLinear()
    .domain([1997, d3.max(filteredData, d => d.year)])
    .range([margin.left, width - margin.right]);

  // Y scale (position range: 1 to 5 or adjust based on data range)
  const yMin = d3.min(filteredData, d => Math.min(d.avg_pos, d.sd_pos));
  const yMax = d3.max(filteredData, d => Math.max(d.avg_pos, d.sd_pos));
  const yScale = d3.scaleLinear()
    .domain([Math.floor(yMin) - 0.5, Math.ceil(yMax) + 0.5])
    .range([height - margin.bottom, margin.top]);

  // Line generators
  const avgLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.avg_pos));

  const sdLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.sd_pos));

  // Draw average position line
  svg.append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", avgLine);

  // Draw standard deviation line
  svg.append("path")
    .datum(filteredData)
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-width", 2)
    .attr("d", sdLine);

  // Axes
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .text("Year");

  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Position Metric");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);

  legend.append("rect")
    .attr("x", 0).attr("y", 0).attr("width", 15).attr("height", 15)
    .attr("fill", "steelblue");
  legend.append("text")
    .attr("x", 20).attr("y", 12).text("Avg. Position");

  legend.append("rect")
    .attr("x", 0).attr("y", 25).attr("width", 15).attr("height", 15)
    .attr("fill", "tomato");
  legend.append("text")
    .attr("x", 20).attr("y", 37).text("Position SD");
}

function drawPosFluidityChart(data) {
  const width = 900, height = 500;
  const margin = { top: 50, right: 200, bottom: 50, left: 60 }; // increased right margin for labels

  const svg = d3.select("#viz-container").append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([
      d3.min(data, d => Math.min(d.avg_pos, d.sd_pos)) - 0.1,
      d3.max(data, d => Math.max(d.avg_pos, d.sd_pos)) + 0.1
    ])
    .range([height - margin.bottom, margin.top]);

  const avgLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.avg_pos));

  const sdLine = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.sd_pos));

  // Draw lines
  svg.append("path").datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", avgLine);

  svg.append("path").datum(data)
    .attr("fill", "none")
    .attr("stroke", "tomato")
    .attr("stroke-width", 2)
    .attr("d", sdLine);

  // Add line labels at end of lines
  const lastPoint = data[data.length - 1];

  svg.append("text")
    .attr("x", xScale(lastPoint.year) + 5)
    .attr("y", yScale(lastPoint.avg_pos))
    .text("Average Number of Positions Played")
    .attr("fill", "steelblue")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

  svg.append("text")
    .attr("x", xScale(lastPoint.year) + 5)
    .attr("y", yScale(lastPoint.sd_pos))
    .text("Standard Deviation Multiple Position Share")
    .attr("fill", "tomato")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));

  // Chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Average Position & Std Dev Over Time (1997–2025)");
}

// Scene 2 Chart A (use drawLineChart2 with custom y-axis scale & label)
function drawScene2ChartA() {
  d3.csv("data/Position Fluidity.csv").then(data => {
  data.forEach(d => {
    d.year = +d.season;  // 👈 use season for the x-axis
    d.avg_pos = +d.avg_positions;  // 👈 match CSV column
    d.sd_pos = +d.multi_pos_share;  // 👈 use correct field
  });
  console.log("Scene 2A data:", data);  
  const cleaned = data.filter(d =>
  !isNaN(d.year) && !isNaN(d.avg_pos) && !isNaN(d.sd_pos)
  );
  console.log("Scene 2A cleaned:", cleaned);  
  drawPosFluidityChart(cleaned);

});

}

function drawAdvancedStatConvergence(data) {
  const width = 900, height = 400;
  const margin = { top: 50, right: 200, bottom: 50, left: 60 };

  const statsToShow = ["TRB", "AST", "USG"];
  const svg = d3.select("#viz-container").append("svg")
    .attr("width", width)
    .attr("height", statsToShow.length * height);

  statsToShow.forEach((stat, i) => {
    const statData = data.filter(d => d.stat.toUpperCase() === stat);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(statData, d => d.year))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(statData, d => d.value))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
      .domain([...new Set(statData.map(d => d.pos))]);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value));

    const chartGroup = svg.append("g")
      .attr("transform", `translate(0, ${i * height})`);

    const positions = d3.group(statData, d => d.pos);
    positions.forEach((values, pos) => {
      values.sort((a, b) => a.year - b.year);

      chartGroup.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(pos))
        .attr("stroke-width", 2)
        .attr("d", line);

      // Label at the end of the line
      const last = values[values.length - 1];
      chartGroup.append("text")
        .attr("x", xScale(last.year) + 5)
        .attr("y", yScale(last.value))
        .text(pos)
        .attr("fill", color(pos))
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    // Axes
    chartGroup.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    chartGroup.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Chart title
    chartGroup.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`${stat}% by Position Over Time`);
  });
}


function drawScene2ChartB() {
  d3.csv("data/advanced filtered.csv").then(data => {
    data.forEach(d => {
      d.year = +d.season;
      d.value = +d.value;
      d.stat = d.stat.toUpperCase();  // normalize stat casing
    });

    const cleaned = data.filter(d =>
      d.stat && d.pos && !isNaN(d.year) && !isNaN(d.value) &&
      ["TRB", "AST", "USG"].includes(d.stat)
    );
    drawAdvancedStatConvergence(cleaned);
  });
}

function drawPaceVs3PAScatter() {
  const width = 900, height = 500;
  const margin = { top: 50, right: 40, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container").append("svg")
    .attr("width", width)
    .attr("height", height);

  d3.csv("data/pace3p.csv").then(data => {
    // Convert and clean
    data.forEach(d => {
      d.pace = +d.Pace;
      d.x3pa = +d["3PA"];
      d.season = d.Season?.trim(); // if column is 'Season'
    });

    // Scales with fixed x-axis domain
    const xScale = d3.scaleLinear()
      .domain([85, 105]) // <- limit x-axis
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x3pa))
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Scatter plot points
    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.pace))
      .attr("cy", d => yScale(d.x3pa))
      .attr("r", 4)
      .attr("fill", "steelblue");

    // Labels on each point
    svg.selectAll("text.label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => xScale(d.pace) + 5)
      .attr("y", d => yScale(d.x3pa) + 3)
      .text(d => d.season)
      .style("font-size", "10px")
      .style("fill", "#333");

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .text("League Pace");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .text("3PA per Game");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text("League Pace vs 3PA per Game (Scatter Plot)");
  });
}
function drawLeBronProfile() {
  // Load both CSV files in parallel
  Promise.all([
    d3.csv("data/Player Play By Play.csv", d3.autoType),
    d3.csv("data/Advanced.csv", d3.autoType)
  ]).then(([playByPlayData, advancedData]) => {
    // === First Chart: Position Percentages ===
    const lebronSeasons = playByPlayData
      .filter(d => d.player === "LeBron James")
      .map(d => {
        const total = d.pg_percent + d.sg_percent + d.sf_percent + d.pf_percent + d.c_percent;
        return {
          season: d.season,
          PG: d.pg_percent / total,
          SG: d.sg_percent / total,
          SF: d.sf_percent / total,
          PF: d.pf_percent / total,
          C: d.c_percent / total
        };
      })
      .sort((a, b) => a.season - b.season);

    const positions = ["PG", "SG", "SF", "PF", "C"];
    const posColors = d3.schemeCategory10;

    const width = 850;
    const height = 450;
    const margin = { top: 50, right: 150, bottom: 50, left: 60 };

    const svg1 = d3.select("#viz-container").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x1 = d3.scaleLinear()
      .domain(d3.extent(lebronSeasons, d => d.season))
      .range([margin.left, width - margin.right]);

    const y1 = d3.scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    svg1.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x1).tickFormat(d3.format("d")));

    svg1.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y1).tickFormat(d3.format(".0%")));

    const line1 = pos =>
      d3.line()
        .x(d => x1(d.season))
        .y(d => y1(d[pos]));

    positions.forEach((pos, i) => {
      svg1.append("path")
        .datum(lebronSeasons)
        .attr("fill", "none")
        .attr("stroke", posColors[i])
        .attr("stroke-width", 2)
        .attr("d", line1(pos));

      const last = lebronSeasons[lebronSeasons.length - 1];
      svg1.append("text")
        .attr("x", x1(last.season) + 5)
        .attr("y", y1(last[pos]))
        .text(pos)
        .style("fill", posColors[i])
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    svg1.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("LeBron James – Normalized Position Percentages by Season");

    // === Second Chart: Advanced Stats ===
    const lebronStats = advancedData
      .filter(d => d.player === "LeBron James")
      .map(d => ({
        season: d.season,
        AST: d.ast_percent,
        TRB: d.trb_percent,
        x3p_ar: d.x3p_ar,
        ftr: d.f_tr,
        USG: d.usg_percent
      }))
      .sort((a, b) => a.season - b.season);

    const metrics = ["AST", "TRB", "3PAr", "FTr", "USG"];
    const advColors = d3.schemeTableau10; // Use a different palette for clarity

    const svg2 = d3.select("#viz-container").append("svg")
      .attr("width", width)
      .attr("height", height);

    const x2 = d3.scaleLinear()
      .domain(d3.extent(lebronStats, d => d.season))
      .range([margin.left, width - margin.right]);

    const y2 = d3.scaleLinear()
      .domain([
        0,
        d3.max(lebronStats, d => d3.max(metrics, key => d[key]))
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg2.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x2).tickFormat(d3.format("d")));

    svg2.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y2));

    const line2 = key =>
      d3.line()
        .x(d => x2(d.season))
        .y(d => y2(d[key]));

    metrics.forEach((key, i) => {
      svg2.append("path")
        .datum(lebronStats)
        .attr("fill", "none")
        .attr("stroke", advColors[i])
        .attr("stroke-width", 2)
        .attr("d", line2(key));

      const last = lebronStats[lebronStats.length - 1];
      svg2.append("text")
        .attr("x", x2(last.season) + 5)
        .attr("y", y2(last[key]))
        .text(key)
        .style("fill", advColors[i])
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
    });

    svg2.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("LeBron James – Advanced Stats by Season");
  });
}
