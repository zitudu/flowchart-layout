import { Node } from './network'
import { allSame, interset, diff } from './utils'

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

function leastCommonAncestor<T> (nodes: Node<T>[]): Node<T> | null {
  let c = null; let ret = null
  const ancestors = nodes.map(node => node.ancestors())
  // console.log(ancestors)
  /* eslint-disable-next-line no-cond-assign */
  while (c = allSame(ancestors.map(it => it.pop()))) ret = c
  return ret
}

function group<T> (node: Node<T>, groupId = 0, visited: Node<T>[] = []): number {
  if (visited.includes(node)) return groupId
  visited.push(node)
  if (node.parents.length > 1) {
    const groupStart = leastCommonAncestor(node.parents)
    if (!groupStart) {
      console.error('[flowchart-layout] wrong state', node)
      return groupId
    }
    node.groupEnd = groupId
    const parents = [[node]]
    const allNodes: Node<T>[] = []
    while (parents.length > 0) {
      const nodes = parents.pop()!
      if (nodes.some(it => it === groupStart)) continue
      nodes.forEach(it => {
        it.addGroup(groupId)
        allNodes.push(it)
        parents.push(it.parents)
      })
    }
    groupStart.addGroup(groupId)
    allNodes.push(groupStart)
    let curNode: Node<T> | null = null
    /* eslint-disable-next-line no-cond-assign */
    while (curNode = allNodes.pop()!) {
      const groupedChildren = interset(curNode.children, allNodes)
      if (groupedChildren.length > 1) {
        console.log('[flowchart-layout] group', curNode, groupedChildren)
        curNode.groupedChildren.push({ nodes: groupedChildren, groupId })
      }
    }
    groupId++
  }
  // if (node.noChild()) {
  //   node.addGroup(groupId)
  //   node.ancestors().forEach(it => it.addGroup(groupId))
  //   return groupId
  // }
  node.children.forEach(it => { groupId = group(it, groupId, visited) })
  return groupId
}

export class Layout {
  /* eslint-disable-next-line no-useless-constructor */
  constructor (private options: LayoutOptions) { }

  layout<T> (root: Node<T>): { nodes: Node<T>[]; links: Link[]; width: number; height: number } {
    if (root.noChild()) return { nodes: [], links: [], width: 0, height: 0 }
    const { xSpacing, ySpacing, minWidth, minHeight, nodeSize, linkAnchorWidth } = this.options
    const { width } = root
    const minRow = (minHeight / width)
    const row = (minRow + ySpacing) < nodeSize[1] ? nodeSize[1] : minRow
    const minCol = (minWidth / root.height)
    const col = (minCol + xSpacing) < nodeSize[0] ? nodeSize[0] : minCol

    // console.log({ col, row })

    group(root)

    const nodes: Node<T>[] = []
    const links: Link[] = []

    const walkChildren = (node: Node<T>, col: number) => {
      if (nodes.includes(node)) {
        return
      }
      nodes.push(node)
      node.children.forEach((kid, index) => {
        let groupedWith: {nodes: Node<T>[]; groupId: number} | null = null
        node.groupedChildren.forEach(g => {
          if (g.nodes.includes(kid)) {
            groupedWith = g
          }
        })
        // console.log('[flowchart-layout] node grouped with', node, groupedWith)
        const walkBranch = (node: Node<T>, index: number, total: number, parent: Node<T>, groupedWith: {nodes: Node<T>[]; groupId: number} | null, col: number) => {
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
            if (groupedWith.nodes[0] === node) {
              links.push({
                type: LinkType.BRANCH,
                start: {
                  x: parent.x + nodeSize[0],
                  y: parent.y + nodeSize[1] / 2
                },
                end: {
                  x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
                  y: node.y + nodeSize[1] / 2 + (groupedWith.nodes.length - 1) / 2 * row
                }
              })
            }
            const groupPoint = {
              x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
              y: groupedWith.nodes[0].y + nodeSize[1] / 2 + (groupedWith.nodes.length - 1) / 2 * row
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
          walkChildren(node, col)
        }
        walkBranch(kid, index, node.children.length, node, groupedWith, col)
      })
    }

    root.x = root.y = 0
    root.children.reduce((acc, node, ind) => {
      const height = node.height + 1
      const minCol = (minWidth / height)
      const col = (minCol + xSpacing) < nodeSize[0] ? nodeSize[0] : minCol
      node.x = (height - node.height - 0.5) * col - nodeSize[0] / 2
      node.y = (acc + node.width / 2) * row - nodeSize[1] / 2
      if (root.groupedChildren.length > 0) {
        if (ind === 0) {
          links.push({
            type: LinkType.MAIN_START,
            start: root,
            end: { x: linkAnchorWidth, y: node.y + nodeSize[1] / 2 + (root.groupedChildren.length - 1) / 2 * row }
          })
        } else {
          links.push({
            type: LinkType.BRANCH,
            start: links[0].end,
            end: { x: node.x, y: node.y + nodeSize[1] / 2 }
          })
        }
      } else {
        links.push({
          type: LinkType.MAIN_START,
          start: root,
          end: { x: node.x, y: node.y + nodeSize[1] / 2 }
        })
      }

      walkChildren(node, col)

      return acc + node.width
    }, 0)

    return { nodes, links, width: root.height * col, height: root.width * row }
  }

  layout2<T> (root: Node<T>): { nodes: Node<T>[]; links: Link[]; width: number; height: number } {
    if (root.noChild()) return { nodes: [], links: [], width: 0, height: 0 }
    const { xSpacing, ySpacing, minWidth, minHeight, nodeSize, linkAnchorWidth } = this.options
    const { width } = root
    const minRow = (minHeight / width)
    const row = (minRow + ySpacing) < nodeSize[1] ? nodeSize[1] : minRow
    const minCol = (minWidth / root.height)
    const col = (minCol + xSpacing) < nodeSize[0] ? nodeSize[0] : minCol

    group(root)

    const nodes: Node<T>[] = []
    const links: Link[] = []

    root.x = root.y = 0

    const q: {node: Node<T>; index: number; parent: Node<T>; col: number; row: number }[] = []

    root.children.reduce((acc, node, index) => {
      nodes.push(node)
      const height = node.height + 1
      const minCol = (minWidth / height)
      const col = (minCol + xSpacing) < nodeSize[0] ? nodeSize[0] : minCol
      node.x = (height - node.height - 0.5) * col - nodeSize[0] / 2
      node.y = (acc + node.width / 2) * row - nodeSize[1] / 2
      if (root.groupedChildren.length > 0) {
        if (index === 0) {
          const endY = (node.width + (root.width - root.children[root.children.length - 1].width - node.width) / 2) * row
          links.push({
            type: LinkType.MAIN_START,
            start: root,
            end: { x: linkAnchorWidth, y: endY }
          })
        }
        links.push({
          type: LinkType.BRANCH,
          start: links[0].end,
          end: { x: node.x, y: node.y + nodeSize[1] / 2 }
        })
      } else {
        links.push({
          type: LinkType.MAIN_START,
          start: root,
          end: { x: node.x, y: node.y + nodeSize[1] / 2 }
        })
      }

      q.push(...node.children.map((it, index) => ({
        node: it,
        index,
        col,
        row,
        parent: node
      })))

      return acc + node.width
    }, 0)

    while (q.length !== 0) {
      const { node, index, parent, col, row } = q.pop()!
      if (nodes.includes(node) || node.depth !== parent.depth + 1) {
        continue
      }
      nodes.push(node)
      q.push(...node.children.map((it, index) => ({ node: it, index, col, row, parent: node })))
      node.x = parent.x + col + (parent.height - 1 - node.height) * col / 2
      node.y = parent.y + (index - (parent.children.length - 1) / 2) * row

      let groupedWith: {nodes: Node<T>[]; groupId: number} | null = null
      parent.groupedChildren.forEach(g => {
        if (g.nodes.includes(node)) groupedWith = g
      })

      if (groupedWith === null) {
        if (node.groupEnd >= 0) {
          const groupParents = node.parents.filter(p => p.group.includes(node.groupEnd))
          const { val, min } = diff(groupParents, node => node.y)
          node.y = min + val / 2
          const point = { x: node.x - linkAnchorWidth, y: node.y }
          groupParents.forEach(p => {
            links.push({
              type: LinkType.BRANCH,
              start: {
                x: p.x + nodeSize[0],
                y: p.y + nodeSize[1] / 2
              },
              end: point
            })
          })
          links.push({
            type: LinkType.BRANCH,
            start: point,
            end: { x: node.x, y: node.y }
          })
        } else {
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
        }
      } else {
        if (groupedWith!.nodes[0] === node) {
          links.push({
            type: LinkType.BRANCH,
            start: {
              x: parent.x + nodeSize[0],
              y: parent.y + nodeSize[1] / 2
            },
            end: {
              x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
              y: node.y + nodeSize[1] / 2 + (groupedWith!.nodes.length - 1) / 2 * row
            }
          })
        }
        const groupPoint = {
          x: parent.x + nodeSize[0] + this.options.linkAnchorWidth,
          y: groupedWith!.nodes[0].y + nodeSize[1] / 2 + (groupedWith!.nodes.length - 1) / 2 * row
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
    }

    return { nodes, links, width: root.height * col, height: root.width * row }
  }
}
