// Adapted from janosh/diagrams (MIT).
// The color/style dicts below should eventually be replaced by the shared styles.yaml.

#import "@preview/cetz:0.4.2": canvas, draw
#import draw: circle, content, line

#set page(width: auto, height: auto, margin: 8pt)

#canvas({
  // --- Colors (logic-only: override these to retheme) ---
  let colors = (
    A: rgb("#ffd700"), // Gold
    B: rgb("#ff4d4d"), // Red
    C: rgb("#90ee90"), // Light green
    D: rgb("#4d94ff"), // Blue
    E: rgb("#9370db"), // Purple
    F: rgb("#ff69b4"), // Pink
    box-fill: rgb("ddd"), // Aggregation box background
  )

  // --- Styles (logic-only: override these to retheme) ---
  let styles = (
    node-radius: 0.3,
    node-stroke: 0.5pt,
    edge-stroke: 0.4pt,
    arrow-stroke: 0.5pt,
    arrow-scale: 0.5,
    arrow-offset: 2pt,
    box-stroke: 0.2pt,
    box-padding-main: (3pt, 7pt),
    box-padding-sub: (2pt, 4pt),
    graph-sep: 4.5,
  )

  // Derived composite styles
  let arrow-style = (
    mark: (end: "stealth", fill: black, scale: styles.arrow-scale, offset: styles.arrow-offset),
    stroke: styles.arrow-stroke,
  )
  let edge-style = (stroke: styles.edge-stroke)

  // Helper to draw a node with label
  let draw-node(pos, label, name) = {
    circle(pos, radius: styles.node-radius, fill: colors.at(label), stroke: styles.node-stroke, name: name)
    content(pos, label, anchor: "center")
  }

  // Input Graph (left side)
  // Define node positions
  let target-pos = (-1.5, 1.2)
  let b-pos = (0.5, 2)
  let c-pos = (1, 1)
  let d-pos = (-2.5, -.7)
  let e-pos = (-0.25, -1.25)
  let f-pos = (1.5, 0)

  // Draw nodes
  draw-node(target-pos, "A", "target")
  draw-node(b-pos, "B", "b")
  draw-node(c-pos, "C", "c")
  draw-node(d-pos, "D", "d")
  draw-node(e-pos, "E", "e")
  draw-node(f-pos, "F", "f")

  // Add target node label
  content((rel: (0, 1.5), to: "target"), "Target Node", name: "target-label")
  line("target-label.south", "target", ..arrow-style)

  // Draw edges
  for (start, end) in (
    ("target", "b"),
    ("target", "c"),
    ("b", "c"),
    ("target", "d"),
    ("c", "e"),
    ("c", "f"),
    ("e", "f"),
  ) {
    line(start, end, ..edge-style)
  }

  // Add "Input Graph" label
  content((0.25, -1.8), [Input Graph])

  // Main aggregation box
  let box-pos = (styles.graph-sep, 0.5)
  content(
    box-pos,
    [Aggregation\ for Node A],
    name: "agg-box",
    fill: colors.box-fill,
    frame: "rect",
    stroke: styles.box-stroke,
    padding: styles.box-padding-main,
  )

  // First layer nodes - renamed to show they're neighbors of A
  let first-layer = (
    (2, 2, "B", "a-to-b"),
    (2, 0, "C", "a-to-c"),
    (2, -2, "D", "a-to-d"),
  )

  // Draw first layer nodes and arrows
  for (dx, dy, label, name) in first-layer {
    draw-node((rel: (dx, dy), to: "agg-box.east"), label, name)
    line(name, "agg-box.east", ..arrow-style)
  }

  content((rel: (0, .7), to: "a-to-b"), "Hop 1")

  // Draw aggregation boxes for each first layer node
  for node in ("a-to-b", "a-to-c", "a-to-d") {
    let letter = node.split("-").at(-1)
    content(
      (rel: (2, 0), to: node),
      [Aggr(#upper(letter))],
      fill: colors.box-fill,
      frame: "rect",
      stroke: styles.box-stroke,
      padding: styles.box-padding-sub,
      name: "aggr-" + letter,
    )
    line("aggr-" + letter, node, ..arrow-style)
  }


  // Second layer nodes and connections - renamed to show full path
  let second-layer = (
    // From B-aggregation (B's neighbors)
    ((2, 1), "A", "aggr-b", "b-to-a"),
    ((2, 0), "C", "aggr-b", "b-to-c"),
    // From C-aggregation (C's neighbors)
    ((2, 1), "A", "aggr-c", "c-to-a"),
    ((2, 0.25), "B", "aggr-c", "c-to-b"),
    ((2, -0.5), "E", "aggr-c", "c-to-e"),
    ((2, -1.25), "F", "aggr-c", "c-to-f"),
    // From D-aggregation (D's neighbors)
    ((2, 0), "A", "aggr-d", "d-to-a"),
  )

  // Draw second layer nodes and arrows
  for ((dx, dy), label, parent, name) in second-layer {
    draw-node((rel: (dx, dy), to: parent), label, name)
    line(name, parent + ".east", ..arrow-style)
  }

  content((rel: (0, .7), to: "b-to-a"), "Hop 2")
})
