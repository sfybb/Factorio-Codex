import {beforeEach, describe, expect, test} from "@jest/globals";

import "./mocks/BaseMocks"
import "./mocks/LuaMocks"

import FibonacciHeap from "../src/core/FibonacciHeap";

describe("Fibonacci Heap", () => {
    let heap: FibonacciHeap<string>;

    beforeEach(() => {
        heap = new FibonacciHeap();
    });

    test("insert should add elements and update min", () => {
        heap.insert(5, "A");
        heap.insert(2, "B");
        heap.insert(8, "C");

        expect(heap.minKey()).toBe(2);
    });

    test("deleteMin should remove the minimum element", () => {
        heap.insert(5, "A");
        heap.insert(2, "B");
        heap.insert(8, "C");

        expect(heap.deleteMin()?.key).toBe(2);
        expect(heap.minKey()).toBe(5);
    });

    test("deleteMin should handle empty heap", () => {
        expect(heap.deleteMin()).toBeUndefined();
    });

    test("mergeLists should correctly merge circular doubly linked lists", () => {
        const nodeA = heap.insert(3, "A");
        const nodeB = heap.insert(7, "B");

        expect(nodeA.right).toBe(nodeB);
        expect(nodeB.left).toBe(nodeA);
    });

    test("consolidate should restructure the heap properly", () => {
        heap.insert(3, "A");
        heap.insert(7, "B");
        heap.insert(1, "C");
        heap.insert(5, "D");
        heap.insert(2, "E");

        heap.deleteMin(); // Should trigger consolidate

        expect(heap.minKey()).toBe(2);
    });

    test("link should correctly link nodes", () => {
        const nodeA = heap.insert(3, "A");
        const nodeB = heap.insert(7, "B");

        const linkedNode = heap.link(nodeA, nodeB);
        expect(linkedNode).toBe(nodeA);
        expect(nodeB.parent).toBe(nodeA);
        expect(nodeA.child).toBe(nodeB);
    });

    test("insert should increase num_nodes", () => {
        expect(heap.num_nodes).toBe(0);
        heap.insert(5, "A");
        heap.insert(2, "B");
        expect(heap.num_nodes).toBe(2);
    });

    test("deleteMin should decrease num_nodes", () => {
        heap.insert(5, "A");
        heap.insert(2, "B");
        heap.deleteMin();
        expect(heap.num_nodes).toBe(1);
    });

    test("removes elements in order", () => {
        let vals = [
            {k: 8, v: "A"}, {k: 6, v: "B"}, {k: 17, v: "C"}, {k: 19, v: "D"}, {k: 10, v: "E"},
            {k: 18, v: "F"}, {k: 15, v: "G"}, {k: 5, v: "H"}, {k: 12, v: "I"}, {k: 16, v: "J"},
            {k: 11, v: "K"}, {k: 13, v: "L"}, {k: 9, v: "M"}, {k: 2, v: "N"}, {k: 1, v: "O"},
            {k: 4, v: "P"}, {k: 3, v: "Q"}, {k: 7, v: "R"}, {k: 14, v: "S"}, {k: 20, v: "T"}
        ]

        for (let v of vals) {
            heap.insert(v.k, v.v)
        }

        vals.sort((a, b) => a.k - b.k)
        for (let v of vals) {
            let n = heap.deleteMin()
            expect(v.k).toStrictEqual(n?.key)
            expect(v.v).toStrictEqual(n?.value)
        }
    })

    test("Nothing is lost", () => {
        for (let i = 0; i < 100; i++) { heap.insert(i, 'A') }

        for (let i = 0; i < 100; i++) {
            let node = heap.deleteMin()
            expect(node).not.toBeUndefined()
            if (node == undefined) continue

            expect(node.key).toBe(i);
            expect(node.value).toBe('A');
        }
    })
})