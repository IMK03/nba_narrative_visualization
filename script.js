let currentScene = 1;

document.addEventListener("DOMContentLoaded", function () {
  showScene(currentScene);

  d3.select("#next").on("click", () => {
    if (currentScene < 5) {
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
    drawScene2ChartA();
    d3.select("#scene-text").text("Players are playing more positions over time — the era of positionless basketball is here.");
  }

  if (sceneNum === 5) {
    drawScene2ChartB();
    d3.select("#scene-text").text("Roles are blending: guards rebound, bigs assist, and everyone uses possessions. Stats are converging.");
  }
  if (sceneNum === 6) {
    drawScene2ChartC();
    d3.select("#scene-text").text("Pace-and-space revolution: faster play, more threes.");
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
    .text("Season");

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
    const margin = { top: 50, right: 100, bottom: 50, left: 60 };

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

    const avgLine = d3.line().x(d => xScale(d.year)).y(d => yScale(d.avg_pos));
    const sdLine = d3.line().x(d => xScale(d.year)).y(d => yScale(d.sd_pos));

    svg.append("path").datum(data)
      .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2).attr("d", avgLine);
  
    svg.append("path").datum(data)
      .attr("fill", "none").attr("stroke", "tomato").attr("stroke-width", 2).attr("d", sdLine);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

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
    d.year = +d.year;
    d.avg_pos = +d.avg_pos;
    d.sd_pos = +d.sd_pos;
  });
  drawPosFluidityChart(data);
});

}

function drawAdvancedStatConvergence(data) {
  const width = 900, height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container").append("svg")
    .attr("width", width)
    .attr("height", height);

  // Get unique stats
  const stats = Array.from(new Set(data.map(d => d.stat)));
  
  // One chart per stat
  stats.forEach((stat, i) => {
    const statData = data.filter(d => d.stat === stat);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(statData, d => d.year))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(statData, d => +d.value))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(Array.from(new Set(statData.map(d => d.pos))));

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value));

    const group = svg.append("g")
      .attr("transform", `translate(0, ${i * height})`);

    const statGroup = group.append("g");

    const positions = d3.group(statData, d => d.pos);
    positions.forEach((values, pos) => {
      statGroup.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(pos))
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Axes
    statGroup.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    statGroup.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

    // Label
    statGroup.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(stat.toUpperCase() + " by Position Over Time");
  });
}

function drawScene2ChartB() {
  d3.csv("data/advanced filtered.csv").then(data => {
    data.forEach(d => {
      d.year = +d.year;
      d.value = +d.value;
    });
    drawAdvancedStatConvergence(data);
  });
}


function drawScene2ChartC() {
  const svgC = d3.select("#viz-container").append("svg")
    .attr("width", 900)
    .attr("height", 500);

  const marginC = { top: 50, right: 90, bottom: 50, left: 60 };
  const widthC = 900 - marginC.left - marginC.right;
  const heightC = 500 - marginC.top - marginC.bottom;

  const gC = svgC.append("g").attr("transform", `translate(${marginC.left},${marginC.top})`);

  Promise.all([
    d3.csv("data/Team Summaries.csv", d3.autoType),       // contains 'Season' and 'pace'
    d3.csv("data/Team Stats Per Game.csv", d3.autoType)    // contains 'Season' and 'x3pa_per_game'
  ]).then(([summaries, perGame]) => {
    const paceData = summaries.filter(d => d.Season >= 1997);
    const threePAData = perGame.filter(d => d.Season >= 1997);

    // X-axis scale
    const x = d3.scaleLinear()
      .domain(d3.extent(paceData, d => d.Season))
      .range([0, widthC]);

    // Y-axis for pace
    const yLeft = d3.scaleLinear()
      .domain([d3.min(paceData, d => d.pace) - 1, d3.max(paceData, d => d.pace) + 1])
      .range([heightC, 0]);

    // Y-axis for 3PA per game
    const yRight = d3.scaleLinear()
      .domain([d3.min(threePAData, d => d.x3pa_per_game) - 1, d3.max(threePAData, d => d.x3pa_per_game) + 1])
      .range([heightC, 0]);

    // Draw axes
    gC.append("g")
      .attr("transform", `translate(0,${heightC})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    gC.append("g").call(d3.axisLeft(yLeft));
    gC.append("g")
      .attr("transform", `translate(${widthC},0)`)
      .call(d3.axisRight(yRight));

    // Draw pace line
    const paceLine = d3.line()
      .x(d => x(d.Season))
      .y(d => yLeft(d.pace));

    gC.append("path")
      .datum(paceData)
      .attr("fill", "none")
      .attr("stroke", "#1f77b4")
      .attr("stroke-width", 2)
      .attr("d", paceLine);

    // Draw 3PA line
    const x3paLine = d3.line()
      .x(d => x(d.Season))
      .y(d => yRight(d.x3pa_per_game));

    gC.append("path")
      .datum(threePAData)
      .attr("fill", "none")
      .attr("stroke", "#ff7f0e")
      .attr("stroke-width", 2)
      .style("stroke-dasharray", "4,4")
      .attr("d", x3paLine);

    // Chart title
    svgC.append("text")
      .attr("x", marginC.left + widthC / 2)
      .attr("y", marginC.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text("League Pace & 3PA per Game (1997–Present)");

    // Y-axis labels
    svgC.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", - (marginC.top + heightC / 2))
      .attr("text-anchor", "middle")
      .text("Pace");

    svgC.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", marginC.left + widthC + 20)
      .attr("x", - (marginC.top + heightC / 2))
      .attr("text-anchor", "middle")
      .text("3PA per Game");

    // Legend
    const legend = svgC.append("g")
      .attr("transform", `translate(${marginC.left + widthC - 160}, ${marginC.top})`);

    legend.append("line")
      .attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
      .attr("stroke", "#1f77b4").attr("stroke-width", 2);
    legend.append("text").attr("x", 25).attr("y", 5).text("Pace").style("font-size", "12px");

    legend.append("line")
      .attr("x1", 0).attr("x2", 20).attr("y1", 20).attr("y2", 20)
      .attr("stroke", "#ff7f0e").attr("stroke-width", 2).style("stroke-dasharray", "4,4");
    legend.append("text").attr("x", 25).attr("y", 25).text("3PA per Game").style("font-size", "12px");
  });
}

