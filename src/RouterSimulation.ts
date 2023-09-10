import chalk from 'chalk';

import { XMPPChatDatasource } from "./chat/infrastructure/datasources/XMPPChatDatasource";

class RouterSimulation {
	xmppChatDatasource?: XMPPChatDatasource;

	/**
	 * Start the router simulation
	 * @param jid 
	 * @param password 
	 */
	async start(jid: string, password: string) {
		this.xmppChatDatasource = new XMPPChatDatasource(jid, password);	// ! For now, we are hardcoding the user and password
		this.configureXmppListeners();
		await this.xmppChatDatasource.start({ debugMode: false });
	}


	/**
	 * Configure all listeners for the XMPP client
	 * @returns 
	 */
	configureXmppListeners() {
		if (!this.xmppChatDatasource) return;
		this.xmppChatDatasource.onOnline = async () => {
			console.log(chalk.green('Router is online.'));
		};

		this.xmppChatDatasource.onLoginError = () => {
			console.log(chalk.red('Could not initialize the router. Verify alumchat credentials.'));			
		};

		this.xmppChatDatasource.onPresenceReceived = (jid: string, connectionStatus: string, status?: string) => {
			console.log(chalk.gray(`${jid} is now ${connectionStatus} ${status ? `(${status})` : ''}`))
		};

		
		this.xmppChatDatasource.onMessageReceived = (from: string, message: string, type: string) => {
			if (type === 'chat') {					
				console.log(chalk.blueBright(`Message from ${from}: ${message}`));
			} else if (type === 'groupchat') {				
				console.log(chalk.blueBright(`Group Message from ${from}: ${message}`));
			}
		};
	}
}