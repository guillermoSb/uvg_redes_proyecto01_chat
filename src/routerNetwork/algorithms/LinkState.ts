import { Edge } from '../graphTools/Edge';
import { Graph } from '../graphTools/Graph';
import { Node } from './../graphTools/Node';
import { Djikstra } from './Dijkstra';

export class LinkStateRoutingPacket {
	identity: string;
	costs: Map<string, number>
	
	constructor(identity: string, costs: Map<string, number>) {
		this.identity = identity;
		this.costs = costs;
	}
}


export class LinkStateRoutingNode {
	name: string;
	costs: Map<string, number>;
	distranceTables: Map<string, Map<string, number>>;

	constructor(name: string) {
		this.name = name;
		this.costs = new Map();
		this.distranceTables = new Map();
	}
	
	addNeighbor(node: string, cost: number) {
		this.costs.set(node, cost);
	}

	createPacket(): LinkStateRoutingPacket {
		return new LinkStateRoutingPacket(this.name, this.costs);
	}

	processPacket(packet: LinkStateRoutingPacket) {
		this.distranceTables.set(packet.identity, packet.costs);
	}
}


class LinkStatePath {
	destination: string;
	cost: number;
	stepts: string[];

	constructor(destination: string, cost: number, stepts: string[]) {
		this.destination = destination;
		this.cost = cost;
		this.stepts = stepts;
	}
}


export const linkStateRouting = (node: LinkStateRoutingNode): LinkStatePath[] => {
	// * Create Initial node
	let startNode = new Node(node.name);
	// * Create Initial graph
	let adjacencyList = new Map<Node, Edge[]>();
	let createdNodes: Node[] = [];
	// * Add the costs to the graph
	node.costs.forEach((cost, neighbor) => {
		let newNode = new Node(neighbor);
		adjacencyList.set(newNode, []);
		adjacencyList.set(startNode, adjacencyList.get(startNode) != null ? adjacencyList.get(startNode)!.concat(new Edge(newNode, cost)) : [new Edge(newNode, cost)]);
		createdNodes.push(newNode);
	});
	// * Add the neighbors to the graph
	node.distranceTables.forEach((costs, neighbor) => {
		let node: Node;
		if (createdNodes.findIndex(node => node.name === neighbor) !== -1) {
			node = createdNodes[createdNodes.findIndex(node => node.name === neighbor)];
		} else {
			node = new Node(neighbor);
			createdNodes.push(node);
			adjacencyList.set(node, []);
		}
		costs.forEach((cost, neighbor) => {
			let neighborNode: Node;
			if (createdNodes.findIndex(node => node.name === neighbor) !== -1) {
				neighborNode = createdNodes[createdNodes.findIndex(node => node.name === neighbor)];
			} else {
				neighborNode = new Node(neighbor);
				createdNodes.push(neighborNode);
				adjacencyList.set(neighborNode, []);
			}
			adjacencyList.set(node, adjacencyList.get(node)!.concat(new Edge(neighborNode, cost)));
		});
		
	});
	const graph = new Graph(adjacencyList);
	graph.removeEmptyNodes();	
	let paths: LinkStatePath[] = [];

	for (const destiny of createdNodes) {
		if (destiny.name == startNode.name) continue;
		const djikstra = new Djikstra(startNode, destiny, graph);
		djikstra.apply();
		let path = djikstra.getPath();
		paths.push(new LinkStatePath(destiny.name, djikstra.weights.get(destiny) || 0, path.reverse()));
	}
	
	return paths;
}