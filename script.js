d3.csv("data/Player Per Game Adjusted.csv").then(data => {
  data.forEach(d => {
    d.season = +d.season;
    d.x3pa_per_game = +d.x3pa_per_game;
  });

  // Filter to core positions only
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const filteredData = data.filter(d => positions.includes(d.pos));

  // Group: season → position → array of players
  const nested = d3.rollups(
    filteredData,
    v => d3.mean(v, d => d.x3pa_per_game),
    d => d.season,
    d => d.pos
  );

  // Reshape into array of objects like:
  // { pos: "PG", values: [{ season: 1980, avg: 0.4 }, ...] }
  const posLines = positions.map(pos => {
    return {
      pos: pos,
      values: nested.map(([season, posMap]) => {
        return {
          season: season,
          avg: (posMap instanceof Map ? posMap.get(pos) : posMap[pos]) ?? 0
        };
      }).sort((a, b) => a.season - b.season)
    };
  });

  // Dimensions
  const width = 900;
  const height = 500;
  const margin = { top: 50, right: 100, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.season))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(posLines.flatMap(d => d.values.map(v => v.avg)))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(positions)
    .range(d3.schemeSet1);

  // Line generator
  const line = d3.line()
    .x(d => xScale(d.season))
    .y(d => yScale(d.avg));

  // Draw each position line
  posLines.forEach(lineData => {
    svg.append("path")
      .datum(lineData.values)
      .attr("fill", "none")
      .attr("stroke", color(lineData.pos))
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add label at end
    const last = lineData.values[lineData.values.length - 1];
    svg.append("text")
      .attr("x", xScale(last.season) + 5)
      .attr("y", yScale(last.avg))
      .attr("dy", "0.35em")
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
