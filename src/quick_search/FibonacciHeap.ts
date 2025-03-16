type Node<T> = {
    key: number,       // priority value
    value: T,   // payload (e.g. graph node or other data)
    degree: number,      // number of children
    mark: boolean,    // whether this node has lost a child
    parent?: Node<T>,    // pointer to parent node
    child?: Node<T>,     // pointer to one of the child nodes
    left: Node<T>,      // left sibling in a circular list
    right: Node<T>,     // right sibling in a circular list
}

function createNode<T>(key: number, value: T): Node<T> {
    let node: any = {
        key: key,
        value: value,
        degree: 0,
        mark: false,
    }
    node.left = node
    node.right = node

    return node
}

export default class FibonacciHeap<T> {
    min?: Node<T> = undefined
    num_nodes: number = 0
    rootList?: Node<T> = undefined

    static load<T>(this: void, h: FibonacciHeap<T>) {
        // @ts-ignore
        setmetatable(h, FibonacciHeap.prototype)
    }

    size(): number {
        return this.num_nodes
    }

    mergeLists(a?: Node<T>, b?: Node<T>): Node<T> | undefined {
        if (a == undefined) return b
        if (b == undefined) return a

        a.right.left = b.left
        b.left.right = a.right
        a.right = b
        b.left = a
        return a
    }

    isEmpty(): boolean {
        return !(this.num_nodes > 0)
    }

    clear() {
        this.min = undefined
        this.num_nodes = 0
        this.rootList = undefined
    }

    minKey(): number | undefined {
        return this.min?.key
    }

    insert(key: number, value: T) : Node<T> {
        let node = createNode(key, value)
        this.rootList = this.mergeLists(this.rootList, node)

        if (this.min == undefined || this.min.key > key) {
            this.min = node
        }
        this.num_nodes++
        return node
    }

    deleteMin(): Node<T> | undefined {
        let min = this.min
        if (min != undefined) {
            // Remove min from rootList
            this.num_nodes--
            min.left.right = min.right
            min.right.left = min.left

            if (this.rootList == min) {
                // Set rootList to other node than min
                if (min.right == min) {
                    this.rootList = undefined
                } else {
                    this.rootList = min.right
                }
            }

            // Add min's children to rootList
            let child = min.child
            if (child != undefined) {
                // Create some orphans
                let cur = child;
                do {
                    cur.parent = undefined
                    cur = cur.right
                } while (cur != child);

                // Not that the parent is ... gone, we can add the orphans to the rootList
                this.rootList = this.mergeLists(this.rootList, child)
            }

            if (min == min.right && min.child == undefined) {
                this.min = undefined
            } else {
                this.min = this.rootList
                this.consolidate()
            }
        }
        return min
    }

    consolidate() {
        let D = Math.floor(2 * Math.log2(this.num_nodes)) + 1
        let A: (Node<T> | null)[] = []
        for (let i = 0; i < D; i++) {
            A[i] = null
        }

        let rootList = this.rootList
        if (rootList != undefined) {
            // Iterate over every item in rootList
            let cur: Node<T> = rootList
            let next = cur.right // keeps track of the next element in rootList
            let lastIteration = next == next.right
            while (true) {
                // remove cur from rootList
                next.left = cur.left
                cur.left.right = next

                cur.right = cur
                cur.left = cur

                let same_rank = A[cur.degree]

                while(same_rank) {
                    A[cur.degree] = null
                    cur = this.link(cur, same_rank)
                    same_rank = A[cur.degree]
                }
                A[cur.degree] = cur

                // Since cur is changed during the loop it cant be used to determine the loop end
                // Something like "cur == next" might work in some cases but if cur is changed it would break
                if (lastIteration) break
                cur = next

                // There is no next element so the remaining one has to be processed
                if (next == next.right) lastIteration = true
                next = next.right
            }

            this.min = undefined
            rootList = undefined
            // Rebuild rootList and determine the new minimum
            for (let e of A) {
                if(e != undefined) {
                    // Isolate e
                    e.parent = undefined
                    e.left = e
                    e.right = e

                    // Add e to lastIteration
                    rootList = this.mergeLists(rootList, e)

                    // Update min
                    if (this.min == undefined || this.min.key > e.key) {
                        this.min = e
                    }
                }
            }
            this.rootList = rootList
        }
    }

    link(A: Node<T>, B: Node<T>): Node<T> {
        if (A.key > B.key) {
            let tmp = A
            A = B
            B = tmp
        }

        // Remove B from rootList
        B.left.right = B.right
        B.right.left = B.left
        B.left = B
        B.right = B
        B.parent = A

        // Add B as A's child
        let child = A.child
        if (child != undefined) {
            A.child = this.mergeLists(child, B);
        } else {
            A.child = B;
        }
        A.degree++

        B.mark = false

        return  A
    }

    toDOT(): string {
        let lines: string[] = []
        lines.push("digraph FibonacciHeap {")
        lines.push("  node [shape=record];")

        let nodeIds: LuaMap = new LuaMap()  // Mapping from node to unique identifier.
        let counter = 0
        let getNodeId = function (node: any) {
            if (!nodeIds.has(node)) {
                nodeIds.set(node, "node" + counter)
                counter = counter + 1
            }
            return nodeIds.get(node)

        }

        let that = this
        let visited: LuaSet = new LuaSet()
        let  traverse = function (node: any, inRootList?: boolean) {
            let id = getNodeId(node)
            if (visited.has(id)) return
            visited.add(id)

            let label = `Key: ${node.key}\\nValue: ${node.value}\\nDegree: ${node.degree}`
            if (node.mark) {
                label += "\\nMarked"
            }
            if (node == that.min) {
                label += "\\nMin"
            }
            lines.push(`  ${id} [${inRootList == true ? 'shape="circle",' : ""}label="${label}"];`)
            /*if (node.parent) {
                lines.push(`  ${id} -> ${getNodeId(node.parent)} [style=dashed]; // parent`)
            }*/
            //lines.push(`  ${id} -> ${getNodeId(node.left)} [penwidth=2, arrowhead=none]; // left`)
            lines.push(`  ${id} -> ${getNodeId(node.right)} [penwidth=2, arrowhead=none]; // right`)

            if (node.child) {
                let childIds: string[] = []
                let child = node.child
                do {
                    traverse(child)
                    lines.push(`  ${id} -> ${getNodeId(child)}; // child`)
                    childIds.push(getNodeId(child))
                    child = child.right
                } while (child != node.child);

                if (childIds.length > 1) {
                    lines.push(`  subgraph cluster_${id}_children {`)
                    lines.push(`    graph [style=rounded]`)
                    lines.push(`    rank=same`)
                    lines.push(`    dummy1 [shape=point, width=0, height=0, style=invis]; // Invisible node`)
                    lines.push(`    dummy1 -> ${childIds[0]} [style=invis, constraint=false]; // Forces left-to-right order`)
                    lines.push(`    ${childIds.join(" -> ")} [style=invis];`)
                    lines.push(`  }`)
                }
            }
        }

        if (this.rootList) {
            let rootIds: string[] = []
            let cur = this.rootList
            do {
                traverse(cur, true)
                rootIds.push(getNodeId(cur))
                cur = cur.right
            } while (cur != this.rootList);

            if (rootIds.length > 1) {
                lines.push(`{rank=source; ${rootIds.join("; ")};}`)
            }
        }

        lines.push("}")
        return lines.join("\n")
    }
}