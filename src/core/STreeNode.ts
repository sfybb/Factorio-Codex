import SubString from 'core/SubString'



class STreeNode<T extends AnyNotNil> {
    static id: number = 0
    static getId<T extends AnyNotNil>(n: STreeNode<T>): string {
        let res = "node"
        // @ts-ignore
        if (n.__uniqueid == undefined) {
            // @ts-ignore
            n.__uniqueid = STreeNode.id
            res += STreeNode.id
            STreeNode.id++
        } else {
            // @ts-ignore
            res += n.__uniqueid
        }

        return res
    }

    data: LuaSet<T>

    edges: LuaTable<string, Edge<T>>

    suffix?: STreeNode<T>

    constructor() {
        this.data = new LuaSet()
        this.edges = new LuaTable()
        this.suffix = undefined
    }

    static Load<T extends AnyNotNil>(this: void, node?: STreeNode<T>) {
        if (node == undefined) return

        // @ts-ignore
        setmetatable(node, STreeNode.prototype)

        if (node.suffix != undefined) {
            // @ts-ignore
            setmetatable(node.suffix, STreeNode.prototype)
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

    getEdge(str: SubString | string): Edge<T> | undefined {
        let char = typeof str == "string" ? str.charAt(0) : str.charAt(0)
        if (char == "") return undefined
        return this.edges.get(char)
    }

    addEdge(str: SubString, otherNode?: STreeNode<T>): Edge<T> {
        let tmp = this.getEdge(str)
        if (tmp != undefined && tmp.dest == otherNode) return tmp

        otherNode = otherNode ?? new STreeNode<T>()
        let char = str.charAt(0)
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
        out.push(`\t${STreeNode.getId(this)} [label="[${this.getDataStr()}]",${additionalAttribs}style=filled,shape=circle,width=0.1,height=0.1]`)
        for (let [_,e] of Object.entries(this.edges)) {
            e.dest.printNodes(out)
        }
    }

    printEdges(out: string[]) {
        for (let [_,e] of Object.entries(this.edges)) {
            out.push(`\t${STreeNode.getId(this)} -> ${STreeNode.getId(e.dest)} [label="${e.label.toString()}",weight=100]`)
            e.dest.printEdges(out)
        }
    }

    printSuffixlink(out: string[]) {
        if (this.suffix != undefined) {
            out.push(`\t${STreeNode.getId(this)} -> ${STreeNode.getId(this.suffix)} [label="",style=dotted,weight=0]`)
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

        out.push(`\tdata${STreeNode.getId(this)} [shape=box,label="${dataprint.join('\\n')}"]`)
        out.push(`\t${STreeNode.getId(this)} -> data${STreeNode.getId(this)}`)
        return true
    }
}

export class Edge<T extends AnyNotNil> {
    dest: STreeNode<T>
    label: SubString

    constructor(dest: STreeNode<T>, label: SubString) {
        this.dest = dest
        this.label = label
    }

    static Load<T extends AnyNotNil>(this: void, edge?: Edge<T>) {
        if (edge == undefined) return

        // @ts-ignore
        setmetatable(edge, Edge.prototype)

        STreeNode.Load(edge.dest)
        SubString.Load(edge.label)
    }
}

export default STreeNode