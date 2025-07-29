d3.csv("data/Player Per Game Adjusted.csv").then(data => {
  // Parse season and 3PA
  data.forEach(d => {
    d.season = +d.season;
    d.x3pa_per_game = +d.x3pa_per_game;
  });

  // Group by season and calculate average 3PA per game
  const avg3PA = d3.rollup(
    data,
    v => d3.mean(v, d => d.x3pa_per_game),
    d => d.season
  );

  // Convert to sorted array
  const avg3PAArray = Array.from(avg3PA, ([season, avg]) => ({ season, avg }))
    .sort((a, b) => a.season - b.season);

  // Set dimensions
  const width = 800;
  const height = 500;
  const margin = { top: 50, right: 40, bottom: 50, left: 60 };

  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(avg3PAArray, d => d.season))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(avg3PAArray, d => d.avg)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => xScale(d.season))
    .y(d => yScale(d.avg));

  // Draw line
  svg.append("path")
    .datum(avg3PAArray)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // X-axis
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

  // Y-axis
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
    .text("Average 3-Point Attempts Per Game by Season (≥ 12 MPG)");
});
