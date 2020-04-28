import { sum } from './utils'

export class Node<T> {
  x = 0
  y = 0
  size: [number, number] = [1, 1]
  parents: Node<T>[] = []
  children: Node<T>[] = []
  group: number[] = []
  groupedChildren: Node<T>[][] = []
  data?: T

  setData (data: T) {
    this.data = data
  }

  addChild (node: Node<T>): this {
    this.children.push(node)
    node.parents.push(this)
    return this
  }

  removeChild (node: Node<T>): this {
    if (!this.hasChild(node)) return this
    const deleteIndex = this.children.findIndex(it => it === node)
    this.children.splice(deleteIndex, 1)
    return this
  }

  hasChild (node: Node<T>): boolean {
    return this.children.includes(node)
  }

  noChild (): boolean {
    return this.children.length === 0
  }

  addParent (node: Node<T>): this {
    this.parents.push(node)
    node.children.push(this)
    return this
  }

  removeParent (node: Node<T>): this {
    const deleteIndex = this.children.findIndex(it => it === node)
    this.children.splice(deleteIndex, 1)
    return this
  }

  addGroup (group: number) {
    this.group.push(group)
  }

  ancestors (): Node<T>[] {
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    let curNode: Node<T> = this
    const nodes: Node<T>[] = []
    let i = 0
    while (curNode != null) {
      nodes.push(...curNode.parents)
      curNode = nodes[i++]
    }
    return nodes
  }

  get height (): number {
    if (this.noChild()) return 0
    return Math.max(...this.children.map(node => node.height)) + 1
  }

  get width (): number {
    if (this.noChild()) return 1
    return sum(...this.children.map(node => node.width))
  }
}
