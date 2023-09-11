import { Node } from "./Node";

export class Edge {
    node: Node;
    weight: number;

    constructor(node: Node, weight: number) {
        this.node = node;
        this.weight = weight;
    }
}