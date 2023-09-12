import { MessageDTO } from './infrastructure/dtos/messageDTO';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { XMPPChatDatasource } from "../chat/infrastructure/datasources/XMPPChatDatasource";
import { ConfigDTO } from './infrastructure/dtos/configDTO';
import { EchoDTO } from './infrastructure/dtos/echoDTO';
import { LinkStateRoutingNode, LinkStateRoutingPacket, linkStateRouting } from './algorithms/LinkState';
import { InfoDTO } from './infrastructure/dtos/infoDTO';
import { Link } from 'stanza/protocol';

const LINK_STATE = 'link-state';
const DISTANCE_VECTOR = 'distance-vector';

export class RouterSimulation {
	jid: string;
	password: string;
	xmppChatDatasource?: XMPPChatDatasource;
	
	routerNames: Map<string, string> = new Map();
	topography: Map<string, string[]> = new Map();
	sentPackets: Set<string> = new Set();
	algorithm: string;

	linkStateNode?: LinkStateRoutingNode;

	
	constructor(jid: string, password: string, algorithm: string) {
		this.jid = jid;
		this.password = password;
		this.algorithm = algorithm;
	}

	/**
	 * Name of the router. For example: A
	 */
	get routerName(): string {
		for (let [key, value] of this.routerNames.entries()) {
			if (value === this.jid) return key;
		}
		return '';
	}


	/**
	 * Loads all config files
	 */
	loadConfigFiles() {
		// loading names
		const namesConfig: ConfigDTO = JSON.parse(fs.readFileSync(path.join(__dirname, './names.json'), 'utf-8'));
		this.handleConfiguration(namesConfig);
		// loading topography
		const topoConfig: ConfigDTO = JSON.parse(fs.readFileSync(path.join(__dirname, './topo.json'), 'utf-8'));
		this.handleConfiguration(topoConfig);
	}
	

	/**
	 * Start the router simulation
	 * @param jid 
	 * @param password 
	 */
	async start(debugMode: boolean = false) {
		this.xmppChatDatasource = new XMPPChatDatasource(this.jid, this.password);
		this.configureXmppListeners();
		await this.xmppChatDatasource.start({ debugMode });
	}


	/**
	 * Configure all listeners for the XMPP client
	 * @returns 
	 */
	configureXmppListeners() {
		if (!this.xmppChatDatasource) return;
		
		this.xmppChatDatasource.onOnline = async () => {
			console.log(chalk.green('Router is online.'));
			this.loadConfigFiles();
			if (this.algorithm == LINK_STATE) {
				// Discover neighbor costs
				this._createLinkStateNode();
				this._discoverNeighborCosts();
				
			} else if (this.algorithm == DISTANCE_VECTOR) {
				// TODO: SARA
			}
		};

		this.xmppChatDatasource.onLoginError = () => {
			console.log(chalk.red('Could not initialize the router. Verify alumchat credentials.'));			
		};

		this.xmppChatDatasource.onPresenceReceived = (jid: string, connectionStatus: string, status?: string) => {
			console.log(chalk.gray(`${jid} is now ${connectionStatus} ${status ? `(${status})` : ''}`))
		};

		
		this.xmppChatDatasource.onMessageReceived = (from: string, message: string, type: string) => {
			
			try {
				let messagePayload = JSON.parse(message);
				if (messagePayload.type && messagePayload.type == 'echo') {
					const echoPayload: EchoDTO = messagePayload;
					if (echoPayload.headers.to == this.routerName) {
						// Process echo message if it is for this router
						const timestamp = Date.now();
						echoPayload.payload.timestamp2 = timestamp.toString();
						this.sendEcho(from.split('@')[0], echoPayload);
						this._calculateCosts(echoPayload.headers.from, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
						this._sendLinkStatePacket();
					} else if (echoPayload.headers.from == this.routerName) {
						// Process echo message if it is from this router
						const timestamp = Date.now();
						echoPayload.payload.timestamp2 = timestamp.toString();
						this._calculateCosts(echoPayload.headers.to, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
						this._sendLinkStatePacket();
					}
				} else if (messagePayload.type && messagePayload.type == 'info') {
					// process info message
					const infoPayload: InfoDTO = messagePayload;
					if (infoPayload.headers.to == this.routerName) {
						// Process info message if it is for this router
						const linkStatePacket: LinkStateRoutingPacket = {
							identity: infoPayload.headers.from,
							costs: new Map(Object.entries(infoPayload.payload))
						};
						this.linkStateNode?.processPacket(linkStatePacket);
						console.log(chalk.green('Link state packet received'));
					} else {
						// Forward the message to all neighbors
						this._sendLinkStatePacketToAll(infoPayload);
						// console.log(chalk.yellow(`Forwarding info to all neighbors`, JSON.stringify(infoPayload)));
					}

				} else if (messagePayload.type && messagePayload.type == 'message') {
					const messagePayload: MessageDTO = JSON.parse(message);
					if (messagePayload.headers.to == this.routerName) {
						// Process message if it is for this router
						console.log(chalk.green('Message received', messagePayload.payload, from));
					} else {
						// Process message if it is not for this router
						this.sendMessage(messagePayload.headers.to, messagePayload.payload, messagePayload.headers.hop_count + 1);
					}
				}
			} catch (error) {
				console.log(chalk.red('Invalid message received', message, from));
				console.log(error);
			}
		};
	}

	async forwardPacket(packet: string, destination: string) {
		const jid = this.routerNames.get(destination);
		if (jid) {
			this.xmppChatDatasource?.sendMessage(jid, packet);
		}
	}
	
	/**
	 * Send message to a destination
	 * @param destination 
	 * @param message 
	 * @param hopCount 
	 * @returns 
	 */
	async sendMessage(destination: string, message: string, hopCount: number = 0) {
		if (!this.xmppChatDatasource) return;
		if (destination == this.routerName) return;
		// Create message DTO
		const messagePayload: MessageDTO = {
			type: 'message',
			headers: {
				from: this.routerName,
				to: destination,
				hop_count: hopCount
			},
			payload: message
		}
		// Calculate the path to send the message
		if (this.algorithm == LINK_STATE) {
			const linkStatePath = linkStateRouting(this.linkStateNode!);
			console.log(chalk.green('Link state path: '));
			const path = linkStatePath.find(path => path.destination == destination);
			const nextNode = path?.stepts[1];
			if (nextNode) {
				console.log(chalk.green(`Next node: ${nextNode}`));
				await this.forwardPacket(JSON.stringify(messagePayload), nextNode);
			}
		}
	}

	
	// ------------------- LINK STATE ROUTING ------------------- //
	/**
	 * Calculate the costs with a timestamp
	 * @param neighbor 
	 * @param timestamp1 
	 * @param timestamp2 
	 */
	private _calculateCosts(neighbor: string, timestamp1: number, timestamp2: number): number {
		const cost = timestamp2 - timestamp1;
		this._addNeighborCosts(neighbor, cost);
		return cost;
	}
	
	private _sendLinkStatePacket() {
		const packet = this.linkStateNode?.createPacket();
		const costsObject: any = {};
		packet?.costs.forEach((cost, neighbor) => {
			costsObject[neighbor] = cost;
		});

		const neighbors = this.topography.get(this.routerName);

		if (neighbors) {
			for (let neighbor of neighbors) {
				if (!this.sentPackets.has(neighbor)) {
					const info: InfoDTO = {
						type: 'info',
						headers: {
							from: this.routerName,
							to: neighbor
						},
						payload: costsObject
					};
					this._sendLinkStatePacketToAll(info);
					this.sentPackets.add(neighbor);
				}
			}
		}
	}
	


	/**
	 * Send Link state routing to all neighbors
	 * @param packet 
	 */
	private _sendLinkStatePacketToAll(packet: InfoDTO) {
		const neighbors = this.topography.keys();
		if (neighbors) {
			for (let neighbor of neighbors) {
				if (!this.sentPackets.has(neighbor)) {
					const jid = this.routerNames.get(neighbor);
					if (jid && neighbor != this.routerName) {
						console.log(chalk.yellow(`Sending link state packet to ${jid}`, JSON.stringify(packet)));
						this.xmppChatDatasource?.sendMessage(jid, JSON.stringify(packet));
					}
				}
			}
		}
	}

	/**
	 * Add neighbor costs
	 * @param neighbor 
	 * @param cost 
	 */
	private _addNeighborCosts(neighbor: string, cost: number) {
		this.linkStateNode?.addNeighbor(neighbor, cost);
	}
	
	/**
	 * Creates the link state routing node
	 */
	private _createLinkStateNode() {
		this.linkStateNode = new LinkStateRoutingNode(this.routerName);
	}
	
	private _discoverNeighborCosts() {
		const neighbors = this.topography.get(this.routerName);
		if (neighbors) {
			for (let neighbor of neighbors) {
				const jid = this.routerNames.get(neighbor);
				const timestamp = Date.now();
				if (jid) {
					const echo: EchoDTO = {
						type: 'echo',
						headers: {
							from: this.routerName,
							to: neighbor
						},
						payload: {
							timestamp1: timestamp.toString(),
							timestamp2: ''
						}
					}
					this.sendEcho(jid, echo);
				}
			}
		}
	}

	/**
	 * Send echo message
	 * @param to jid of the destination only the name without the @alumchat.xyz
	 * @param echoMessage 
	 */
	private sendEcho(to: string, echoMessage: EchoDTO) {
		console.log(chalk.yellow(`Sending echo to ${to}`, JSON.stringify(echoMessage)));
		this.xmppChatDatasource?.sendMessage(to, JSON.stringify(echoMessage));
	}


	// ------------------- DISTANCE VECTOR ROUTING ------------------- //


	
	// ------------------- ROUTER CONFIGURATION ------------------- //

	/**
	 * Handles a configuration received
	 * @param config 
	 */
	private handleConfiguration(config: ConfigDTO) {
		if (config.type === 'names') {
			for (let [key, value] of Object.entries(config.config)) {
				this.routerNames.set(key, value.split('@')[0]);
			}
		} else if (config.type === 'topo') {
			for (let [key, value] of Object.entries(config.config)) {
				this.topography.set(key, value);
			}
		}
	}
}