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

d3.csv("data/Player Per Game Adjusted.csv").then(data => {
  console.log("Loaded rows:", data.length);
  console.log(data[0]); // view the first row

  // Sample: draw something from the dataset
  const svg = d3.select("#viz-container")
    .append("svg")
    .attr("width", 800)
    .attr("height", 400);

  svg.append("text")
    .attr("x", 100)
    .attr("y", 50)
    .text(`First Player: ${data[0].player}`)
    .style("font-size", "18px")
    .style("fill", "steelblue");
});
