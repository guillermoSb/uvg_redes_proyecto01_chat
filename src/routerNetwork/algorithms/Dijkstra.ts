import { Graph } from "../graphTools/Graph";
import { Node } from "../graphTools/Node";

export class Djikstra {
    // Usefull variables in order to apply the algorithm
    graph: Graph;
    startNode: Node;
    prevNode: Map<Node, Node | null>;
    targetNode: Node;
    weights: Map<Node, number>;
    visited: Set<Node>;
    unexplored: Set<Node>;
    
    constructor(startNode: Node, targetNode: Node, graph: Graph) { 
        this.graph = graph;
        this.startNode = startNode;
        this.prevNode = new Map();
        this.targetNode = targetNode;
        this.weights = new Map();
        this.visited = new Set();
        this.unexplored = new Set();
		}
	
	

    apply(): void {
        // Initial state of the graph where initial node distance is set to and the rest of nodes distance is set to infinity
        this.graph.adjacencyList.forEach((edges, node) => {
            this.prevNode.set(node, null);
            this.weights.set(node, Infinity);
            this.unexplored.add(node);
        });
			this.weights.set(this.startNode, 0);        
        // While loop to keep checking until all nodes have been visited
        while (this.unexplored.size) {
            let closestNode: Node | null = null;
            let shortestDistance: number = Infinity;

            this.unexplored.forEach(node => {
                const distance = this.weights.get(node);
                // Updating distances for unexplored nodes and chosing the closest one
                if (distance !== undefined && distance < shortestDistance) {
                    closestNode = node;
                    shortestDistance = distance;
                }
            });

            // If there is a closest node, the neighbors are checked and their distances are updated
            if (closestNode) { 
                const edges = this.graph.adjacencyList.get(closestNode);
                if (!(edges)) return;
                
                edges.forEach(edge => {
                    
                    const nodeDistance = closestNode ? this.weights.get(closestNode) || 0 : 0;
                    const prevDistance = this.weights.get(edge.node) || Infinity;
                    // A new distance is calculated to verify if it is shorter than the previous one
                    // based on that, the distance is updated or not in the if block of line 59
                    const newDistance = nodeDistance + edge.weight;

                    if (newDistance < prevDistance) {
                        this.weights.set(edge.node, newDistance);
                        if (edge.node != this.startNode) {
                            this.prevNode.set(edge.node, closestNode);
                        }
                    }
                });

                // The closest node is added to the visited set and removed from the unexplored set
                this.visited.add(closestNode);
                this.unexplored.delete(closestNode);
            } else {
                break;
            }
        }
        // this.showPath();
    }
    
    getPath(): string[] {
        const path: string[] = [];
        // The path is created by going through the previous node map
        // in other words, the path is unrolled from the target node to the start node
        let actualNode: Node | null = this.targetNode;
        while (actualNode) {
            path.push(actualNode.name);
            actualNode = this.prevNode.get(actualNode) || null;
        }
        return path;
    }

    showPath(): void {
        const nodeDistance = this.weights.get(this.targetNode);
        // Checking if there was a way to the target node
        if (!(nodeDistance) || nodeDistance === Infinity) {
            console.log(`No se encontro un camino hacia el nodo ${this.targetNode.name}`);
            return;
        }
        // Displaying the path and the distance
		const path: string[] = this.getPath();
    }
    
}
