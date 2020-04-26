import { Node } from './network'
import { allSame } from './utils'

export interface LayoutOptions {
  xSpacing: number;
  ySpacing: number;
  minWidth: number;
  minHeight: number;
  nodeSize: [number, number];
  // Included in xSpacing
  linkAnchorWidth: number;
}

export const enum LinkType {
  MAIN_START, MAIN_END,
  BRANCH
}

export interface Link {
  type: LinkType;
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
}

function leastCommonAncestor(nodes: Node[]): Node | null {
  let c = null, ret = null
  const ancestors = nodes.map(node => node.ancestors())
  // console.log(ancestors)
  while (c = allSame(ancestors.map(it => it.pop()))) ret = c
  return ret
}

function diff<T>(a: T[], b: T[]): T[] {
  const ret: T[] = []
  for (const it of a) {
    if (!b.includes(it)) ret.push(it)
  }
  return ret
}

function group(node: Node, groupId: number = 0): number {
  if (node.noChild()) {
    node.addGroup(groupId)
    node.ancestors().forEach(it => it.addGroup(groupId))
    return groupId
  }
  if (node.parents.length > 1) {
    const groupEnd = leastCommonAncestor(node.parents)
    if (!groupEnd) {
      console.error('[flowchart-layout] wrong state', node)
      return groupId
    }
    const parents = [node.parents]
    const allNodes: Node[] = []
    while (parents.length > 0) {
      const nodes = parents.pop()
      if (nodes.some(it => it === groupEnd)) continue
      nodes.forEach(it => {
        it.addGroup(groupId)
        allNodes.push(it)
        parents.push(it.parents)
      })
    }
    groupEnd.addGroup(groupId)
    allNodes.push(groupEnd)
    let curNode: Node
    while (curNode = allNodes.pop()) {
      const groupedChildren = diff(allNodes, curNode.children)
      if (groupedChildren.length > 1) {
        curNode.groupedChildren.push(groupedChildren)
      }
    }
    groupId++
  }
  node.children.forEach(node => { groupId = group(node, groupId) })
  return groupId
}


export class Layout {
  constructor(private options: LayoutOptions) { }

  layout(root: Node): { nodes: Node[], links: Link[] } {
    if (root.noChild()) return
    const { xSpacing, ySpacing, minWidth, minHeight, nodeSize } = this.options
    const { height, width } = root
    const minCol = (minWidth / height), minRow = (minHeight / width)
    const paddingY = ySpacing / 2, paddingX = xSpacing / 2
    const col = (minCol + xSpacing) < nodeSize[0] ? nodeSize[0] : minCol
    const row = (minRow + ySpacing) < nodeSize[1] ? nodeSize[1] : minRow

    console.log({ col, row })

    group(root)

    const nodes: Node[] = []
    const links: Link[] = []

    const walkChildren = (node: Node) => node.children.forEach((kid, index) => {
      let groupedWith: Node[] | null = null
      node.groupedChildren.forEach(g => {
        if (g.includes(kid)) {
          groupedWith = g
        }
      })
      walkBranch(kid, index, node.children.length, node, groupedWith);
    })
    const walkBranch = (node: Node, index: number, total: number, parent: Node, groupedWith: Node[] | null) => {
      node.x = parent.x + col
      node.y = parent.y + (index - (total - 1) / 2) * row
      if (groupedWith === null) {
        links.push({
          type: LinkType.BRANCH,
          start: {
            x: parent.x + nodeSize[0],
            y: parent.y + nodeSize[1] / 2
          },
          end: {
            x: node.x,
            y: node.y + nodeSize[1] / 2
          }
        })
      } else {
        if (groupedWith[0] === node) {
          links.push({
            type: LinkType.BRANCH,
            start: {
              x: parent.x + nodeSize[0],
              y: parent.y + nodeSize[1] / 2
            },
            end: {
              x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
              y: node.y + nodeSize[1] / 2 + (groupedWith.length - 1) / 2 * row
            }
          })
        }
        const groupPoint = {
          x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
          y: groupedWith[0].y + nodeSize[1] / 2 + (groupedWith.length - 1) / 2 * row
        }
        links.push({
          type: LinkType.BRANCH,
          start: groupPoint,
          end: {
            x: node.x,
            y: node.y + nodeSize[1] / 2
          }
        })
      }
      walkChildren(node)
    }

    root.x = root.y = 0
    root.children.reduce((acc, node, ind) => {
      node.x = (height - node.height - 0.5) * col - nodeSize[0] / 2
      node.y = (acc + node.width / 2) * row - nodeSize[1] / 2
      nodes.push(node)
      links.push({
        type: LinkType.MAIN_START,
        start: root,
        end: { x: node.x, y: node.y + nodeSize[1] / 2 },
      })

      walkChildren(node)

      return acc + node.width
    }, 0)

    return { nodes, links }
  }
}
