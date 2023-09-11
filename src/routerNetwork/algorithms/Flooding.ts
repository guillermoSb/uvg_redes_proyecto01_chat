import { Node } from '../graphTools/Node';
import { Graph } from '../graphTools/Graph';
import { FloodingPacket } from '../graphTools/FloodingPacket';

// Función para iniciar el proceso de inundación desde un nodo específico.
export function initiateFlooding(startNode: Node, packet: FloodingPacket, graph: Graph): void {
    console.log(`Iniciando inundación desde el nodo ${startNode.name}`);
    startNode.receivePacket(packet, graph); // Inicio de la inundación desde el nodo de inicio.
}

// Función que se llama cuando un paquete es recibido por un nodo.
export function handleReceivedPacket(node: Node, packet: FloodingPacket, fromNode: Node, graph: Graph): void {
    // Verificamos si el paquete ya fue visto antes.
    if (node.seenPackets.has(packet.headers.from + packet.payload)) {
        return; // Si ya fue visto, terminamos la ejecución aquí.
    }

    // Marcamos el paquete como visto para no procesarlo nuevamente en el futuro.
    node.seenPackets.add(packet.headers.from + packet.payload);

    // Enviamos el paquete a todos los vecinos, excepto desde el que lo recibimos.
    const neighbors = graph.getNeighbors(node);
    for (let neighbor of neighbors) {
        if (neighbor !== fromNode) {
            handleReceivedPacket(neighbor, packet, node, graph); // Llamada recursiva para continuar con la inundación.
        }
    }
}