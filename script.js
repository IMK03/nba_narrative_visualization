const svg = d3.select("#viz-container")
  .append("svg")
  .attr("width", 800)
  .attr("height", 400);

svg.append("text")
  .attr("x", 100)
  .attr("y", 200)
  .text("NBA Visualization Coming Soon!")
  .style("font-size", "24px")
  .style("fill", "darkslategray");
