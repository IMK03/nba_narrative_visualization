let currentScene = 1;

document.addEventListener("DOMContentLoaded", function () {
  showScene(currentScene);

  d3.select("#next").on("click", () => {
    if (currentScene < 2) {
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
}

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
      values: d3.range(1980, 2025).map(season => {
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

function drawScene1ChartB() {
  d3.csv("data/Player Per Game Adjusted.csv").then(data => {
    const roles = ["G", "F", "Big", "All"];
    data.forEach(d => {
      d.season = +d.season;
      d.x3pa_per_game = +d.x3pa_per_game;
    });

    const filtered = data.filter(d => d.pos && !isNaN(d.x3pa_per_game));

    const lines = roles.map(role => ({
      pos: role,
      values: d3.range(1980, 2025).map(season => {
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

    drawLineChart(lines, roles, "Grouped 3PA Trends: Guards, Forwards, Bigs, All");
  });
}

function drawLineChart(lines, domainLabels, chartTitle) {
  const width = 900, height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleLinear()
    .domain([1980, 2024])
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
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
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
}
