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
const FLOODING = 'flooding'
const DISTANCE_VECTOR = 'distance-vector';

export class RouterSimulation {
	jid: string;
	password: string;
	xmppChatDatasource?: XMPPChatDatasource;
	
	routerNames: Map<string, string> = new Map();
	topography: Map<string, string[]> = new Map();
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
	 * The total of nodes
	 */
	get totalNodes(): number {

		return this.routerNames.size;
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
		console.log(this.routerNames.size)
		console.log(chalk.blueBright(`My router name is ${this.routerName}`))
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
				this.discoverNeighborCosts();
			}
		};

		this.xmppChatDatasource.onLoginError = () => {
			console.log(chalk.red('Could not initialize the router. Verify alumchat credentials.'));
		};

		this.xmppChatDatasource.onPresenceReceived = (jid: string, connectionStatus: string, status?: string) => {
			console.log(chalk.gray(`${jid} is now ${connectionStatus} ${status ? `(${status})` : ''}`))
		};

		
		this.xmppChatDatasource.onMessageReceived = async (from: string, message: string, type: string) => {
			
			try {
				// Replace single quotes with double quotes 
				message = message.replace(/'/g, '"');
				let messagePayload = JSON.parse(message);
				if (messagePayload.type && messagePayload.type == 'echo') {
					const echoPayload: EchoDTO = messagePayload;
					// Process echo link state
					if (this.algorithm == LINK_STATE) {
						if (echoPayload.headers.to == this.routerName) {
							// Process echo message if it is for this router

							// optional delay
							if (this.routerName == 'D') {
								await this.delay(2000);
							}
							const timestamp = Date.now();
							echoPayload.payload.timestamp2 = timestamp.toString();
							this.sendEcho(from.split('@')[0], echoPayload);
							this._calculateCosts(echoPayload.headers.from, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
							this._sendLinkStatePacket();
							
						} else if (echoPayload.headers.from == this.routerName) {
							// Process echo message if it is from this router
							this._calculateCosts(echoPayload.headers.to, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
							
							this._sendLinkStatePacket();
						}
					}
				} else if (messagePayload.type && messagePayload.type == 'info') {
					const infoPayload: InfoDTO = messagePayload;
					if (infoPayload.headers.to == this.routerName) {
						// Process info message if it is for this router
						const linkStatePacket: LinkStateRoutingPacket = {
							identity: infoPayload.headers.from,
							costs: new Map(Object.entries(infoPayload.payload))
						};
						console.log('Updating my cost table.');
						this.linkStateNode?.processPacket(linkStatePacket);
						console.log(this.linkStateNode?.distranceTables);
						infoPayload.headers.hop_count = 0;
					}
					infoPayload.headers.hop_count--;
					// Forward the message to all neighbors using flooding
					if (infoPayload.headers.hop_count > 0) {
						this._sendLinkStatePacketToAll(infoPayload);
					}
					
				} else if (messagePayload.type && messagePayload.type == 'message') {
					const messagePayload: MessageDTO = JSON.parse(message);
					if (this.algorithm == FLOODING) {
						messagePayload.headers.hop_count--;
						// Print the message if it is for this router
						if (messagePayload.headers.to == this.routerName) {
							console.log(chalk.green(`Message received from ${messagePayload.headers.from}: ${messagePayload.payload}`));
							// Set the hop count to 0 to avoid infinite loops
							messagePayload.headers.hop_count = 0;
						} else {
							// Forward the message to all neighbors
							if (messagePayload.headers.hop_count > 0) {
								this._sendFloodPacket(messagePayload);
							}

						}
					} else if (this.algorithm == LINK_STATE) {
						if (messagePayload.headers.to == this.routerName) {
							console.log(chalk.green(`Message received from ${messagePayload.headers.from}: ${messagePayload.payload}`));
							// Set the hop count to 0 to avoid infinite loops
							messagePayload.headers.hop_count = 0;
						} else {
							// Calcualte link state rotue
							const linkStatePath = linkStateRouting(this.linkStateNode!);
							const path = linkStatePath.find(path => path.destination == messagePayload.headers.to);
							const nextNode = path?.stepts[1];
							if (nextNode) {
								this.forwardPacket(JSON.stringify(messagePayload), nextNode);
							}
						}
					}
				}
			} catch (error) {
				console.log(chalk.red('Invalid message received', message, from));
				console.log(error);
			}
		};
	}

	/**
	 * Forward a packet to a destination
	 * @param packet 
	 * @param destination 
	 */
	async forwardPacket(packet: string, destination: string) {
		if (destination != this.routerName) {			
			const jid = this.routerNames.get(destination);
			if (jid) {
				this.xmppChatDatasource?.sendMessage(jid, packet);
			}
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
			const path = linkStatePath.find(path => path.destination == destination);
			const nextNode = path?.stepts[1];
			console.log('next node on the algorithm is: ', nextNode)
			if (nextNode) {
				await this.forwardPacket(JSON.stringify(messagePayload), nextNode);
			}
		} else if (this.algorithm == FLOODING) {
			messagePayload.headers.hop_count = this.totalNodes;
			this._sendFloodPacket(messagePayload);
		}
	}


	// ------------------- FLOODING ------------------- //

	/**
	 * Send flooding packet
	 * @param packet 
	 */
	private async _sendFloodPacket(packet: MessageDTO | InfoDTO) {
		const neighbors = this.topography.get(this.routerName) ?? [];
		for (const neighbor of neighbors) {
			await this.forwardPacket(JSON.stringify(packet), neighbor);
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
		console.log(chalk.gray(`Cost to ${neighbor}: ${cost}`));
		return cost;
	}
	
	private _sendLinkStatePacket() {
		const packet = this.linkStateNode?.createPacket();
		const costsObject: any = {

		};
		packet?.costs.forEach((cost, neighbor) => {
			costsObject[neighbor] = cost;
		});
		const nodes = this.topography.keys();
		if (nodes) {
			for (let neighbor of nodes) {
				const info: InfoDTO = {
					type: 'info',
					headers: {
						from: this.routerName,
						to: neighbor,
						hop_count: this.totalNodes
					},
					payload: costsObject
				}
				this._sendLinkStatePacketToAll(info);
			}
		}
	}


	/**
	 * Send Link state routing to all neighbors
	 * @param packet 
	 */
	private _sendLinkStatePacketToAll(packet: InfoDTO) {
		// console.log('Sending link state packet: ', packet)
		this._sendFloodPacket(packet);
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
	
	/**
	 * Discover neighbor costs
	 */
	async discoverNeighborCosts() {
		console.log('Discovering neighbors...')
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
					await this.sendEcho(jid, echo);
				}
			}
		}
	}

	/**
	 * Send echo message
	 * @param to jid of the destination only the name without the @alumchat.xyz
	 * @param echoMessage 
	 */
	private async sendEcho(to: string, echoMessage: EchoDTO) {
		console.log(JSON.stringify(echoMessage))
		await this.xmppChatDatasource?.sendMessage(to, JSON.stringify(echoMessage));
	}

	async delay(milliseconds: number) {
		const timer = await new Promise((resolve) => {
			setTimeout(() => {
				resolve("done!");
			}, milliseconds);
		});
		return timer;
		}



	
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