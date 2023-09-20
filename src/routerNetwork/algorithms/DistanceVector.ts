
class DistanceVectorRoutingPacket {
    identity: string;
    distanceTable: Map<string, number>;

    constructor(identity: string, distanceTable: Map<string, number>) {
        this.identity = identity;
        this.distanceTable = distanceTable;
    }
}

class DistanceVectorRoutingNode {
    name: string;
    distanceTable: Map<string, {cost: number, nextHop: string}>;
    neighbors: Map<string, number>;

    constructor(name: string) {
        this.name = name;
        this.distanceTable = new Map();
        this.neighbors = new Map();

        // Adding self to distance table
        this.distanceTable.set(name, {cost: 0, nextHop: name});
    }
    
    addNeighbor(node: string, cost: number) {
        this.neighbors.set(node, cost);
        if (!this.distanceTable.has(node)) {
            this.distanceTable.set(node, {cost: cost, nextHop: node});
        }
    }
    

    createPacket(): DistanceVectorRoutingPacket {
        const tableCost = new Map<string, number>();
        for (const [destination, entry] of this.distanceTable.entries()) {
            tableCost.set(destination, entry.cost);
        }
        return new DistanceVectorRoutingPacket(this.name, tableCost);
    }
    

    processPacket(packet: DistanceVectorRoutingPacket) {
        for (const [destination, cost] of packet.distanceTable.entries()) {
            const calcCost = (this.neighbors.get(packet.identity) || Infinity) + cost;
            if (destination === this.name) continue;

            const destinationValueDT = this.distanceTable.get(destination);
            if (!destinationValueDT || calcCost < destinationValueDT.cost) {
                this.distanceTable.set(destination, {cost: calcCost, nextHop: packet.identity});
            }
        }
    }

    
    getNextHop(destination: string): string | null {
        const destinationValDT = this.distanceTable.get(destination);
        return destinationValDT ? destinationValDT.nextHop : null;
    }

}

const equalTables = <K, V>(beforeTable: Map<K, V>, afterTable: Map<K, V>): boolean => {
    if (beforeTable.size !== afterTable.size) return false;
    for (const [key, val] of beforeTable) { if (afterTable.get(key) !== val) return false }
    return true;
};


export const distanceVectorRouting = (nodes: DistanceVectorRoutingNode[]): void => {
    let change: boolean;
    do {
        change = false;
        const packets: DistanceVectorRoutingPacket[] = nodes.map(node => node.createPacket());

        for (const node of nodes) {
            for (const packet of packets) {
                if (packet.identity !== node.name) {
                    const befTable = new Map(node.distanceTable);
                    node.processPacket(packet);
                    if (!equalTables(befTable, node.distanceTable)) { change = true }
                }
            }
        }
    } while (change);
}


export const distanceVectorRouting1 = (nodes: DistanceVectorRoutingNode[]): void => {
    const packets: DistanceVectorRoutingPacket[] = nodes.map(node => node.createPacket());

    for (const node of nodes) {
        for (const packet of packets) {
            if (packet.identity !== node.name) {
                node.processPacket(packet);
            }
        }
    }
}



export { DistanceVectorRoutingPacket, DistanceVectorRoutingNode };


// Use example:

const A = new DistanceVectorRoutingNode("A");
const B = new DistanceVectorRoutingNode("B");
const C = new DistanceVectorRoutingNode("C");
const D = new DistanceVectorRoutingNode("D");
const E = new DistanceVectorRoutingNode("E");

A.addNeighbor("E", 5);

B.addNeighbor("C", 6);
B.addNeighbor("E", 4);

C.addNeighbor("B", 6);
C.addNeighbor("D", 3);

D.addNeighbor("C", 3);
D.addNeighbor("E", 7);

E.addNeighbor("A", 5);
E.addNeighbor("B", 4);
E.addNeighbor("D", 7);

const nodes = [A, B, C, D, E];

distanceVectorRouting(nodes);

// console.log("Distance table [A]:", [...A.distanceTable]);
// console.log("Distance table [B]:", [...B.distanceTable]);
// console.log("Distance table [C]:", [...C.distanceTable]);
// console.log("Distance table [D]:", [...D.distanceTable]);
// console.log("Distance table [E]:", [...E.distanceTable]);

const nextHop = C.getNextHop("E");
console.log(`Next hop from C to A: ${nextHop}`);
