// Adapted from janosh/diagrams (MIT).
// The color/style dicts below should eventually be replaced by the shared styles.yaml.

#import "@preview/cetz:0.4.2": canvas, draw
#import draw: circle, content, line, scope, set-style, translate

#set page(width: auto, height: auto, margin: 8pt)

// --- Colors (logic-only: override these to retheme) ---
#let colors = (
  node-1: rgb("#f9c5c5"), // Light red
  node-2: rgb("#f2ceaa"), // Light orange
  node-3: rgb("#b9d6f2"), // Light blue
  node-4: rgb("#b1e2d8"), // Light teal
)

// --- Styles (logic-only: override these to retheme) ---
#let styles = (
  node-radius: 0.25,
  node-stroke: 0.8pt,
  node-padding: 1pt,
  edge-stroke: 0.8pt,
)

// Helper function to draw a node with a name
#let node(pos, label, color, name) = {
  content(pos, $n_#label$, frame: "circle", radius: styles.node-radius, fill: color, stroke: styles.node-stroke, name: name, padding: styles.node-padding)
}

#canvas({
  set-style(line: (stroke: styles.edge-stroke))

  // Draw first graph (square)
  scope({
    node((0, 0), 1, colors.node-1, "g1n1")
    node((0, 2), 2, colors.node-2, "g1n2")
    node((2, 2), 3, colors.node-3, "g1n3")
    node((2, 0), 4, colors.node-4, "g1n4")

    line("g1n1", "g1n2")
    line("g1n2", "g1n3")
    line("g1n3", "g1n4")
    line("g1n4", "g1n1")
  })

  // Draw second graph (trapezoid)
  scope({
    translate((4, 0))

    node((0, 0), 1, colors.node-1, "g2n1")
    node((2, 2), 2, colors.node-2, "g2n2")
    node((0, 2), 3, colors.node-3, "g2n3")
    node((2, 0), 4, colors.node-4, "g2n4")

    line("g2n1", "g2n2")
    line("g2n2", "g2n3")
    line("g2n3", "g2n4")
    line("g2n4", "g2n1")
  })

  // Draw third graph (kite)
  scope({
    translate((8, 0))

    node((0, 0), 1, colors.node-1, "g3n1")
    node((2, 2), 2, colors.node-2, "g3n2")
    node((2, 0), 3, colors.node-4, "g3n3")
    node((0, 2), 4, colors.node-3, "g3n4")

    line("g3n1", "g3n2")
    line("g3n2", "g3n3")
    line("g3n3", "g3n4")
    line("g3n4", "g3n1")
  })

  // Draw fourth graph (irregular)
  scope({
    translate((12.5, 0))

    node((-0.5, 0), 1, colors.node-1, "g4n1")
    node((0.25, 2.2), 2, colors.node-2, "g4n2")
    node((2, 1.6), 3, colors.node-3, "g4n3")
    node((-0.7, 1.4), 4, colors.node-4, "g4n4")

    line("g4n1", "g4n2")
    line("g4n2", "g4n3")
    line("g4n3", "g4n4")
    line("g4n4", "g4n1")
  })
})
