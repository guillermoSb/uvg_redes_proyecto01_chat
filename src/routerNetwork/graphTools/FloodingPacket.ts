export type PacketType = 'message' | 'echo' | 'info';

export interface PacketHeaders {
    from: string;
    to: string;
    hop_count: number;
    [key: string]: any; // This allows for additional headers as needed
}

export class FloodingPacket {
    type: PacketType;
    headers: PacketHeaders;
    payload: string;

    constructor(type: PacketType, headers: PacketHeaders, payload: string) {
        this.type = type;
        this.headers = headers;
        this.payload = payload;
    }

    // Utility function to increment the hop count
    incrementHop(): void {
        this.headers.hop_count += 1;
    }
}
