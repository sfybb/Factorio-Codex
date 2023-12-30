import SubString from 'search/suffixtree/SubString'



class Node<T extends AnyNotNil> {
    static id: number = 0
    static getId<T extends AnyNotNil>(n: Node<T>): string {
        let res = "node"
        // @ts-ignore
        if (n.__uniqueid == undefined) {
            // @ts-ignore
            n.__uniqueid = Node.id
            res += Node.id
            Node.id++
        } else {
            // @ts-ignore
            res += n.__uniqueid
        }

        return res
    }

    data: LuaSet<T>

    edges: LuaTable<number, Edge<T>>

    suffix?: Node<T>

    constructor() {
        this.data = new LuaSet()
        this.edges = new LuaTable()
        this.suffix = undefined
    }

    static Load<T extends AnyNotNil>(this: void, node?: Node<T>) {
        if (node == undefined) return

        // @ts-ignore
        setmetatable(node, Node.prototype)

        if (node.suffix != undefined) {
            // @ts-ignore
            setmetatable(node.suffix, Node.prototype)
            // Don't call load for suffix since it can cause loops
        }

        if (node.edges != undefined) {
            for (let [_, edge] of node.edges) {
                Edge.Load(edge)
            }
        }
    }

    collect(set: LuaSet<T>) {
        for (let e of this.data) {
            set.add(e)
        }

        for (let [_, edge] of this.edges) {
            edge.dest.collect(set)
        }
    }

    add(val: T) {
        this.data.add(val)

        let curNode = this.suffix
        while (curNode != undefined) {
            if (curNode.data.has(val)) break

            curNode.data.add(val)
            curNode = curNode.suffix
        }
    }

    getEdge(str: SubString | number): Edge<T> | undefined {
        let charCode = typeof str == "number" ? str : str.charCodeAt(0)
        if (Number.isNaN(charCode)) return undefined
        return this.edges.get(charCode)
    }

    addEdge(str: SubString, otherNode?: Node<T>): Edge<T> {
        let tmp = this.getEdge(str)
        if (tmp != undefined && tmp.dest == otherNode) return tmp

        otherNode = otherNode ?? new Node<T>()
        let char = str.charCodeAt(0)
        if (Number.isNaN(char)) {
            $log_err!(`Adding Nan?!?!?! "${str.originalString}" -- part: "${str.toString()}" (S: ${str.start} L: ${str.length})`)
        }

        tmp = new Edge(otherNode, str)
        this.edges.set(char, tmp)
        return tmp
    }

    // graphviz tools: http://www.webgraphviz.com/; https://dreampuf.github.io/GraphvizOnline/
    toGraphviz(out: string[], suffixLinks?: boolean) {
        out.push("// Nodes")
        this.printNodes(out)

        out.push("// Edges")
        this.printEdges(out)

        if (suffixLinks == true) {
            out.push("// Suffix links")
            this.printSuffixlink(out)
        }
    }

    printNodes(out: string[]) {
        //let hasData = this.printData(out)
        let additionalAttribs = ""

        //if (hasData) additionalAttribs += `color="aquamarine2",`

        // @ts-ignore
        out.push(`\t${Node.getId(this)} [label="[${this.getDataStr()}]",${additionalAttribs}style=filled,shape=circle,width=0.1,height=0.1]`)
        for (let [_,e] of Object.entries(this.edges)) {
            e.dest.printNodes(out)
        }
    }

    printEdges(out: string[]) {
        for (let [_,e] of Object.entries(this.edges)) {
            out.push(`\t${Node.getId(this)} -> ${Node.getId(e.dest)} [label="${e.label.toString()}",weight=100]`)
            e.dest.printEdges(out)
        }
    }

    printSuffixlink(out: string[]) {
        if (this.suffix != undefined) {
            out.push(`\t${Node.getId(this)} -> ${Node.getId(this.suffix)} [label="",style=dotted,weight=0]`)
        }

        for (let [_,e] of Object.entries(this.edges)) {
            e.dest.printSuffixlink(out)
        }
    }

    getDataStr() {
        let res = []
        for (let e of this.data) {
            res.push(e)
        }
        return res.join(",")
    }

    printData(out: string[]): boolean {
        let dataprint: string[] = []
        for (let d of this.data) {
            dataprint.push(`${d}`)
        }

        if (dataprint.length == 0) return false

        out.push(`\tdata${Node.getId(this)} [shape=box,label="${dataprint.join('\\n')}"]`)
        out.push(`\t${Node.getId(this)} -> data${Node.getId(this)}`)
        return true
    }
}

export class Edge<T extends AnyNotNil> {
    dest: Node<T>
    label: SubString

    constructor(dest: Node<T>, label: SubString) {
        this.dest = dest
        this.label = label
    }

    static Load<T extends AnyNotNil>(this: void, edge?: Edge<T>) {
        if (edge == undefined) return

        // @ts-ignore
        setmetatable(edge, Edge.prototype)

        Node.Load(edge.dest)
        SubString.Load(edge.label)
    }
}

export default Node