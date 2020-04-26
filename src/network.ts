import { sum } from "./utils"

export class Node {
  x = 0
  y = 0
  size: [number, number] = [1, 1]
  parents: Node[] = []
  children: Node[] = []
  group: number[] = []
  groupedChildren: Node[][] = []
  constructor(public data: any) { }

  addChild(node: Node): this {
    this.children.push(node)
    node.parents.push(this)
    return this
  }

  removeChild(node: Node): this {
    if (!this.hasChild(node)) return
    const deleteIndex = this.children.findIndex(it => it === node)
    this.children.splice(deleteIndex, 1)
    return this
  }

  hasChild(node: Node): boolean {
    return this.children.includes(node)
  }

  noChild(): boolean {
    return this.children.length === 0
  }

  addParent(node: Node): this {
    this.parents.push(node)
    node.children.push(this)
    return this
  }

  removeParent(node: Node): this {
    const deleteIndex = this.children.findIndex(it => it === node)
    this.children.splice(deleteIndex, 1)
    return this
  }

  addGroup(group: number) {
    this.group.push(group)
  }

  ancestors(): Node[] {
    let curNode: Node = this
    const nodes: Node[] = []
    let i = 0
    while (curNode != null) {
      nodes.push(...curNode.parents)
      curNode = nodes[i++]
    }
    return nodes
  }

  get height(): number {
    if (this.noChild()) return 0
    return Math.max(...this.children.map(node => node.height)) + 1
  }

  get width(): number {
    if (this.noChild()) return 1
    return sum(...this.children.map(node => node.width))
  }
}
