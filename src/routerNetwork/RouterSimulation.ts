import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { XMPPChatDatasource } from "../chat/infrastructure/datasources/XMPPChatDatasource";
import { ConfigDTO } from './infrastructure/dtos/configDTO';
import { EchoDTO } from './infrastructure/dtos/echoDTO';

const LINK_STATE = 'link-state';
const DISTANCE_VECTOR = 'distance-vector';

export class RouterSimulation {
	jid: string;
	password: string;
	xmppChatDatasource?: XMPPChatDatasource;
	
	routerNames: Map<string, string> = new Map();
	topography: Map<string, string[]> = new Map();
	algorithm: string;


	/**
	 * Name of the router. For example: A
	 */
	get routerName(): string {
		for (let [key, value] of this.routerNames.entries()) {
			if (value === this.jid) return key;
		}
		return '';
	}
	
	constructor(jid: string, password: string, algorithm: string) {
		this.jid = jid;
		this.password = password;
		this.algorithm = algorithm;
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
		this.xmppChatDatasource = new XMPPChatDatasource(this.jid, this.password);	// ! For now, we are hardcoding the user and password
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
						this.calculateCosts(echoPayload.headers.from, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
					} else if (echoPayload.headers.from == this.routerName) {
						// Process echo message if it is from this router
						this.calculateCosts(echoPayload.headers.to, parseInt(echoPayload.payload.timestamp1), parseInt(echoPayload.payload.timestamp2));
					}
				}
			} catch (error) {
				console.log(chalk.red('Invalid message received', message, from));
				console.log(error);
			}
		};
	}
	


	private calculateCosts(neighbor: string, timestamp1: number, timestamp2: number) {
		const cost = timestamp2 - timestamp1;
		console.log(chalk.yellow(`Cost to ${neighbor} is ${cost}`));
	}

	// ------------------- LINK STATE ROUTING ------------------- //
	
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