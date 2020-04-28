import { Node, Layout } from './src'

let id = 0

const nodes: { [id: number]: Node<number> } = {}

const root = nodes[id] = new Node(id++)

const layout = new Layout({
  xSpacing: 20,
  ySpacing: 20,
  minWidth: 600,
  minHeight: 400,
  nodeSize: [2, 2],
  // Included in xSpacing
  linkAnchorWidth: 10
})

for (let i = 0; i < 10; i++) {
  root.addChild(nodes[id] = new Node(id++))
}

console.log(root)
console.log(root.height, root.width)
console.log(layout.layout2(root))

nodes[1]
  .addChild(nodes[11] = new Node(11)
    .addChild(nodes[14] = new Node(14)
      .addChild(nodes[16] = new Node(16)))
    .addChild(nodes[15] = new Node(15)
      .addChild(nodes[16])))
  .addChild(nodes[12] = new Node(12).addChild(nodes[14]))
  .addChild(nodes[13] = new Node(13).addChild(nodes[16]))


console.log(root)
console.log(root.height, root.width)
console.log(layout.layout2(root))
console.log(nodes[16])
// console.log(nodes[1], nodes[11], nodes[12])