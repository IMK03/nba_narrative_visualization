d3.csv("data/Player Per Game Adjusted.csv").then(data => {
  // Parse numbers
  data.forEach(d => {
    d.season = +d.season;
    d.x3pa_per_game = +d.x3pa_per_game;
  });

  // Define 5 core positions
  const corePositions = ["PG", "SG", "SF", "PF", "C"];

  // Filter rows where pos includes one of the 5 core positions
  const filteredData = data.filter(d =>
    d.pos && corePositions.some(pos => d.pos.includes(pos))
  );

  // Group by season + position and calculate average 3PA
  const nested = d3.rollups(
    filteredData,
    v => d3.mean(v, d => d.x3pa_per_game),
    d => d.season,
    d => {
      const match = corePositions.find(pos => d.pos.includes(pos));
      return match ?? "Other";
    }
  );

  // Format: [{ pos: "PG", values: [{ season, avg }, ...] }, ...]
  const posLines = corePositions.map(pos => {
    return {
      pos,
      values: nested.map(([season, posMap]) => {
        const avg = posMap instanceof Map ? posMap.get(pos) : posMap[pos];
        return {
          season,
          avg: avg ?? 0
        };
      }).sort((a, b) => a.season - b.season)
    };
  });

  // Set up SVG
  const width = 900;
  const height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // X and Y scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.season))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(posLines.flatMap(d => d.values.map(v => v.avg)))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(corePositions)
    .range(d3.schemeSet1);

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.season))
    .y(d => yScale(d.avg));

  // Draw lines
  posLines.forEach(lineData => {
    svg.append("path")
      .datum(lineData.values)
      .attr("fill", "none")
      .attr("stroke", color(lineData.pos))
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Label at end of line
    const last = lineData.values[lineData.values.length - 1];
    svg.append("text")
      .attr("x", xScale(last.season) + 5)
      .attr("y", yScale(last.avg))
      .style("fill", color(lineData.pos))
      .style("font-size", "12px")
      .text(lineData.pos);
  });

  // Axes
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Average 3PA per Game by Position (≥ 12 MPG)");
});
