
import { Node } from './Node';
import { Edge } from './Edge';

export class Graph {

    adjacencyList: Map<Node, Edge[]>;

    constructor(adjacency_list?: Map<Node, Edge[]>) {
        this.adjacencyList = adjacency_list || new Map();
    }

    addNode(node: Node): void {
        this.adjacencyList.set(node, []);
    }

    // connecting two nodes with a weight
    addEdge(node1: Node, node2: Node, weight: number): void {
        const connect = (from: Node, to: Node) => {
            const originEdges = this.adjacencyList.get(from) || [];
            if (!originEdges.some(e => e.node === to)) {
                originEdges.push(new Edge(to, weight));
                this.adjacencyList.set(from, originEdges);
            }
        }
        connect(node1, node2);
        connect(node2, node1);
    }

    show(): void {
        for (let [node, edges] of this.adjacencyList.entries()) {
            for (let edge of edges) {
                console.log(`${node.name} -> ${edge.node.name} [W: ${edge.weight}]`);
            }
        }
    }

    hasConverged(previousTables: Map<string, Map<string, string>>): boolean {
        for (const node of this.adjacencyList.keys()) {
            const prevTable = previousTables.get(node.name);
            if (!prevTable || !this.areTablesEqual(prevTable, node.routingTable)) {
                return false;
            }
        }
        return true;
    }

    areTablesEqual(table1: Map<string, string>, table2: Map<string, string>): boolean {
        if (table1.size !== table2.size) return false;

        for (const [key, val] of table1.entries()) {
            if (table2.get(key) !== val) return false;
        }

        return true;
    }


    getNeighbors(node: Node): Node[] {
        const neighbors: Node[] = [];
        const edges = this.adjacencyList.get(node) || [];
        for (let edge of edges) {
            neighbors.push(edge.node);
        }
        return neighbors;
    }

    removeEmptyNodes(): void {
		let emptyNodes: Node[] = [];
		this.adjacencyList.forEach((edges, node) => {
			if (edges.length === 0) {
				emptyNodes.push(node);
			}
		}
		);
		emptyNodes.forEach(node => {
			this.adjacencyList.delete(node);
		});
	}
}