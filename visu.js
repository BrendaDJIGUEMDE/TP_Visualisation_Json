// Fonction pour générer l'objet JSON représentant la structure du dossier
function obtenirStructure(files) {
  const structure = { name: 'root', type: 'directory', children: [] };

  files.forEach(file => {
    const pathParts = file.webkitRelativePath.split('/');
    let currentDir = structure;

    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1 && file.type) {
        currentDir.children.push({ name: part, type: 'file' });
      } else {
        let foundDir = currentDir.children.find(child => child.name === part && child.type === 'directory');
        if (!foundDir) {
          foundDir = { name: part, type: 'directory', children: [] };
          currentDir.children.push(foundDir);
        }
        currentDir = foundDir;
      }
    });
  });

  return structure;
}

// Fonction pour créer le diagramme indenté
function IndentedTreeChart(data) {
  const format = d3.format(",");
  const nodeSize = 17;
  const root = d3.hierarchy(data).eachBefore((i => d => d.index = i++)(0));
  const nodes = root.descendants();
  const width = 600;
  const height = (nodes.length + 1) * nodeSize;

  const columns = [
    {
      label: "Count", 
      value: d => d.children ? 0 : 1, 
      format: (value, d) => d.children ? format(value) : "-", 
      x: 340
    }
  ];

  document.getElementById("IndentedtreeSVG").innerHTML = "";

  const svg = d3.select("#IndentedtreeSVG")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-nodeSize / 2, -nodeSize * 3 / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; overflow: visible;");

  const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#999")
    .selectAll()
    .data(root.links())
    .join("path")
      .attr("d", d => `
        M${d.source.depth * nodeSize},${d.source.index * nodeSize}
        V${d.target.index * nodeSize}
        h${nodeSize}
      `);

  const node = svg.append("g")
    .selectAll()
    .data(nodes)
    .join("g")
      .attr("transform", d => `translate(0,${d.index * nodeSize})`);

  node.append("circle")
      .attr("cx", d => d.depth * nodeSize)
      .attr("r", 2.5)
      .attr("fill", d => d.children ? null : "#999");

  node.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => d.depth * nodeSize + 6)
      .text(d => d.data.name);

  node.append("title")
      .text(d => d.ancestors().reverse().map(d => d.data.name).join("/"));

  for (const {label, value, format, x} of columns) {
    svg.append("text")
        .attr("dy", "0.32em")
        .attr("y", -nodeSize)
        .attr("x", x)
        .attr("text-anchor", "end")
        .attr("font-weight", "bold")
        .text(label);

    node.append("text")
        .attr("dy", "0.32em")
        .attr("x", x)
        .attr("text-anchor", "end")
        .attr("fill", d => d.children ? null : "#555")
        .data(root.copy().sum(value).descendants())
        .text(d => format(d.value, d));
  }
}

// Fonction pour créer le diagramme Icicle
function createIcicle(data) {
  const nodeSize = 17;
  const width = 600;
  const root = d3.hierarchy(data)
      .sum(d => d.children ? 0 : 1)
      .sort((a, b) => b.height - a.height || b.value - a.value);

  const nodes = root.descendants();
  const height = (nodes.length + 1) * nodeSize;

  d3.partition()
      .size([width, height])
      (root);

  const color = d3.scaleOrdinal()
      .domain(root.leaves().map(d => d.data.name))
      .range(d3.schemeCategory10);

  document.getElementById("icicle").innerHTML = "";
  const svg = d3.select("#icicle")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-nodeSize / 2, -nodeSize * 3 / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif; overflow: visible; margin-bottom: 80%;");

  const cell = svg.selectAll("g")
      .data(root.descendants())
      .enter().append("g")
      .attr("transform", d => `translate(${d.y0},${d.x0})`);

  cell.append("rect")
      .attr("width", d => d.y1 - d.y0)
      .attr("height", d => d.x1 - d.x0)
      .attr("fill", d => color(d.data.name))
      .attr("stroke", "#fff")
      .style("transition", "fill 0.3s ease");

  cell.append("text")
      .attr("x", 5)
      .attr("y", 13)
      .attr("dy", ".35em")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text(d => d.data.name)
      .call(wrap, d => d.y1 - d.y0);

  function wrap(text, width) {
    text.each(function() {
      const text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy"));
      let word,
          line = [],
          lineNumber = 0,
          tspan = text.text(null).append("tspan").attr("x", 5).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", 5).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }
}

document.getElementById('fileInput').addEventListener('change', function(event) {
  const files = Array.from(event.target.files);
  const structure = obtenirStructure(files);
  IndentedTreeChart(structure);
  createIcicle(structure);
});
