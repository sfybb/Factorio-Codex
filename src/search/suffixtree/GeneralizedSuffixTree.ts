import {default as Node, Edge} from 'search/suffixtree/Node'
import SubString from 'search/suffixtree/SubString'
import ISearchable from "search/Searchable";

/* Based primarily on Ukkonen's algorithm which works great for single strings
 * https://www.cs.helsinki.fi/u/ukkonen/SuffixT1withFigs.pdf
 * Adapted to work more like JEI's generalized suffix tree
 * https://github.com/mezz/JustEnoughItems/blob/1.19.3/Core/src/main/java/mezz/jei/core/search/suffixtree/GeneralizedSuffixTree.java
 */

// Maybe Generalized Suffix Array instead? https://link.springer.com/chapter/10.1007/BFb0027775
// Different Suffix Tree construction algorithm https://www.sciencedirect.com/science/article/pii/S1570866712001062#br0490
class GeneralizedSuffixTree<T extends AnyNotNil> implements ISearchable<T> {
    root: Node<T>

    // like in JEI's treee
    activeLeaf: Node<T>

    constructor() {
        this.root = new Node<T>()
        this.activeLeaf = this.root
    }

    Load() {
        if (this.root != undefined) {
            // @ts-ignore
            setmetatable(this.root, Node.prototype)
            this.root.Load()
        }

        if (this.activeLeaf != undefined) {
            // @ts-ignore
            setmetatable(this.activeLeaf, Node.prototype)
            this.activeLeaf.Load()
        }
    }

    add(key: string, val: T) {
        this.activeLeaf = this.root

        let s = this.root
        let text: SubString = new SubString(key, 0, 0)
        let rest: SubString
        for (const i of $range(0, key.length-1)) {
            rest = new SubString(key, i);
            text.lengthen(1);

            [s, text] = this.update(s, text, rest, key.charCodeAt(i), val);
        }

        // add leaf suffix link, if necessary (JEI)
        if (this.activeLeaf.suffix == undefined && this.activeLeaf != this.root && this.activeLeaf != s) {
            this.activeLeaf.suffix = s
        }
    }

    getResults(search: string, set: LuaSet<T>): void {
        let node = this.findNode(search)

        if (node != undefined) {
            node.collect(set)
        }
    }

    update(s: Node<T>, part: SubString, rest: SubString, curCharCode: number, val: T): LuaMultiReturn<[Node<T>, SubString]> {
        /* oldr ← root; (end–point, r) ← test–and–split(s,(k, i−1), ti);
         * while not(end–point) do
         *     create new transition g'(r,(i, ∞)) = r' where r' is a new state;
         *     if oldr != root then create new suffix link f'(oldr) = r;
         *     oldr ← r;
         *     (s, k) ← canonize(f'(s),(k, i − 1));
         *     (end–point, r) ← test–and–split(s,(k, i − 1), ti);
         * if oldr != root then create new suffix link f'(oldr) = s;
         * return (s, k)
         */
        //assert(rest.length > 0, "Rest is empty!")
        //assert(rest.charCodeAt(0) == curCharCode, "Expected current char at start 0 of rest")


        let partNoCurChar = part.copy()
        partNoCurChar.shorten(1)
        let oldr = this.root
        let [endPoint, r] = this.testAndSplit(s, partNoCurChar, rest, curCharCode, val)

        let leaf: Node<T>
        while( !endPoint ) {
            let tmpE = r.getEdge(curCharCode)
            if (tmpE != undefined) {
                leaf = tmpE.dest
            } else {
                leaf = r.addEdge(rest).dest
                leaf.add(val)
            }

            // update suffix link for newly created leaf
            if (this.activeLeaf != this.root) {
                this.activeLeaf.suffix = leaf
            }
            this.activeLeaf = leaf;

            if (oldr != this.root) {
                oldr.suffix = r
            }
            oldr = r

            if (s.suffix == undefined) {
                //assert(s == this.root, "Expected root node!")
                part = part.substring(1)
                partNoCurChar = part.copy()
                partNoCurChar.shorten(1)
            } else {
                [s, partNoCurChar] = this.canonize(s.suffix, partNoCurChar);
                part = partNoCurChar.copy()
                part.lengthen(1)
            }

            [endPoint, r] = this.testAndSplit(s, partNoCurChar, rest, curCharCode, val)
        }

        if (oldr != this.root) {
            oldr.suffix = r
        }
        return this.canonize(s, part);
    }

    testAndSplit(s: Node<T>, prefix: SubString, rest: SubString, expChar: number, val: T): LuaMultiReturn<[boolean, Node<T>]> {
        /* Ukkonen's algorithm works for a single string
         * but it's missing a check that the rest of the string we want to insert also exists
         * whenever we find a node which has a matching prefix
         * if k ≤ p then
         *     let g'(s,(k', p')) = s' be the t[k]–transition from s;
         *     if t = t[k'+p − k+1] then return(true, s)
         *     else
         *         replace the t[k]–transition above by transitions
         *             g'(s,(k', k' + p − k)) = r and g'(r,(k' + p − k + 1, p')) = s'
         *         where r is a new state;
         *         return(false, r)
         * else if there is no t–transition from s then
         *     return(false, s)
         * else return(true, s)
         */
        //assert(rest.length > 0, "Expected non empty rest")
        //assert(rest.charCodeAt(0) == expChar, "Expected expChar at start 0 of rest");

        [s, prefix] = this.canonize(s, prefix);

        if (prefix.length > 0) {
            let e = s.getEdge(prefix)
            //assert(e != undefined, "Invalid prefix")

            if (e == undefined) return $multi(false, s)

            if (e.label.startsWith(prefix) && e.label.charCodeAt(prefix.length) == expChar) {
                return $multi(true, s)
            } else {
                let newNode = this.splitNode(s, e, prefix)
                //newNode.add(val)
                return $multi(false, newNode)
            }
        }
        // This part is very similar to JEI's
        let e = s.getEdge(expChar)
        if (e == undefined) return $multi(false, s)

        if (e.label.startsWith(rest)) {
            if (e.label.length == rest.length) {
                // perfect match - add our own data
                e.dest.add(val)
                return $multi(true, s)
            } else {
                // edge contains a longer string - split it
                let newNode = this.splitNode(s, e, rest)
                newNode.add(val)
                //e.dest.add(val)
                return $multi(false, s)
            }
        } else {
            //e.dest.add(val)
            return $multi(true, s)
        }
    }

    splitNode(s: Node<T>, e: Edge<T>, commonPart: SubString): Node<T> {
        //assert(e == s.getEdge(commonPart), "Edge not reachable from node with common part")
        //assert(e.label.startsWith(commonPart), "Edge label doesnt start with common part")
        //assert(e.label.length > commonPart.length, "Edge label must be longer than common part")

        let divergentPart = e.label.substring(commonPart.length)
        let newNode = new Node<T>()

        if ( divergentPart.length < 0) {
            $log_err!(`Splitting "${e.label}" (${e.label.originalString}) into "${commonPart}" (${commonPart.originalString}) and "${divergentPart}"`)
            $log_info!(this.toGraphviz())
            throw new Error()
        }

        s.addEdge(commonPart, newNode)
        newNode.addEdge(divergentPart, e.dest)
        return newNode
    }

    canonize(s: Node<T>, rem: SubString): LuaMultiReturn<[Node<T>, SubString]> {
        /*  find the tk–transition g' (s,(k', p')) = s' from s;
         *  while p' - k' ≤ p - k do
         *      k ← k + p' - k' + 1
         *      s ← s'
         *      if k ≤ p then find the tk–transition g' (s,(k', p')) = s' from s;
         *  return (s, k)
         */
        let curNode = s
        while (rem.length > 0) {
            let matchingEdge = curNode.getEdge(rem)
            if (matchingEdge == undefined || !rem.startsWith(matchingEdge.label)) break
            curNode = matchingEdge.dest
            rem = rem.substring(matchingEdge.label.length)
        }

        return $multi(curNode, rem)
    }

    findNode(search: string): Node<T> | undefined {
        let cur = this.root
        let rem = new SubString(search, 0)

        while (rem.length > 0) {
            let e = cur.getEdge(rem)

            // Rest of the search string doesn't match the label of the edge
            // therefore the search string is not contained in the tree
            if (e == undefined || !(e.label.length > rem.length ? e.label.startsWith(rem) : rem.startsWith(e.label) )) return undefined

            // the search string fully contained in the edge label
            if (rem.length <= e.label.length) {
                return e.dest
            }

            cur = e.dest
            rem = rem.substring(e.label.length)
        }

        return undefined
    }

    toGraphviz(suffixLinks?: boolean): string {
        let stringAcc: string[] = []

        stringAcc.push("digraph {")
        stringAcc.push("\trankdir = LR;")

        this.root.toGraphviz(stringAcc, suffixLinks)

        stringAcc.push("}")

        return stringAcc.join("\n")
    }
}

export default GeneralizedSuffixTree