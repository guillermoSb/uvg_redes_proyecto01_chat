import { FloodingPacket } from './FloodingPacket'; 
import { Graph } from './Graph';

export class Node {
    name: string;
    seenPackets: Set<string>;
    routingTable: Map<string, string>; // Registro que mapea el destino al siguiente nodo a visitar

    constructor(name: string) {
        this.name = name;
        this.seenPackets = new Set();
        this.routingTable = new Map();
    }

    // Método para procesar los paquetes que llegan a este nodo
    receivePacket(packet: FloodingPacket, graph: Graph): void {
        console.log(`Node ${this.name} received packet from ${packet.headers.from} intended for ${packet.headers.to}`);
        const neighbors_test = graph.getNeighbors(this);
        console.log(`Node ${this.name} has neighbors:`, neighbors_test.map(n => n.name));
        
        // Verificamos si ya hemos procesado este paquete, si es así, lo descartamos
        if (this.seenPackets.has(packet.headers.from + "_" + packet.payload)) {
            return;
        }

        // Marcamos este paquete como visto
        this.seenPackets.add(packet.headers.from + "_" + packet.payload);

        // Si somos el destino del paquete, lo procesamos
        if (this.name === packet.headers.to) {
            console.log(`Nodo ${this.name} recibió el paquete: ${packet.payload}`);
            return;
        }

        // Si el paquete es de tipo "info", lo utilizamos para actualizar nuestra tabla de enrutamiento
        if (packet.type === "info") {
            this.updateRoutingTable(packet);
        }

        // Incrementamos el contador de saltos del paquete y lo reenviamos a todos nuestros vecinos, excepto al que nos lo envió
        packet.incrementHop();
        const neighbors = graph.adjacencyList.get(this) || [];
        for (const edge of neighbors) {
            if (edge.node.name !== packet.headers.from) {
                edge.node.receivePacket(packet, graph);
            }
        }
    }

    // Método para actualizar nuestra tabla de enrutamiento con la información de un paquete de tipo "info"
    updateRoutingTable(packet: FloodingPacket): void {
        console.log("Received 'info' packet with payload:", packet.payload);
        const vectorDistances = JSON.parse(packet.payload);
        for (const destination of Object.keys(vectorDistances)) {
            const distance = vectorDistances[destination];
            
            // Verificamos la distancia actual en nuestra tabla de enrutamiento y actualizamos si encontramos una ruta más corta
            const currentDistance = this.routingTable.get(destination);
            if (!currentDistance || currentDistance > distance) {
                this.routingTable.set(destination, this.name);
            }
        }
        console.log("Updated routing table:", this.routingTable);
    }    

    // Método para enviar un paquete a todos nuestros vecinos
    sendPacket(packet: FloodingPacket, graph: Graph): void {
        this.seenPackets.add(packet.headers.from + "_" + packet.payload);
        const neighbors = graph.adjacencyList.get(this) || [];
        for (const edge of neighbors) {
            edge.node.receivePacket(packet, graph);
        }
    }
}


