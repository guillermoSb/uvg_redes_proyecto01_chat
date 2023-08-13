import chalk from 'chalk';
import readline from 'readline';
import { XMPPChatDatasource } from '../infrastructure/datasources/XMPPChatDatasource';
import { Roster } from '../domain/entities/Roster';
import { GetRosterUseCase } from '../useCases/GetRosterUseCase';

/**
 * CLIChat
 */
export class CLIChat {
	xmppChatDatasource?: XMPPChatDatasource;

	/**
	 * Configure all listeners for the XMPP client
	 * @returns 
	 */
	configureXmppListeners() {
		if (!this.xmppChatDatasource) return;
		const getRosterUseCase = new GetRosterUseCase(this.xmppChatDatasource);
		this.xmppChatDatasource.onOnline = async () => {
			console.log(chalk.green('You are now online'));
			this._chatPrompt();
		};
		this.xmppChatDatasource.onRosterReceived = async (roster: Roster) => {
			console.log(roster.toString());
		};
		this.xmppChatDatasource.onError = () => {};

		this.xmppChatDatasource.onLoginError = () => {
			console.log('Could not login, try again');
			this.login();
		};
		
	}

	/**
	 * Login to the XMPP server
	 */
	login(): void {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question('Enter your jid: ', async (jid) => {
			console.log(`You entered: ${jid}`);
			rl.question('Enter your password: ', async (password) => {
				rl.close();
				this.xmppChatDatasource = new XMPPChatDatasource('san191517test', '1234567');	// ! For now, we are hardcoding the user and password
				this.configureXmppListeners();
				await this.xmppChatDatasource.start({ debugMode: false });
			});
		});
	}

	
	private _chatPrompt() {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		this._showMenu();
		rl.question('Enter your command: ', async (answer) => {
			const choice = parseInt(answer);
			if (choice == 6) {
				console.log(chalk.green('Logging out...'));
				await this.xmppChatDatasource?.stop();
				return rl.close();
			}

			if (choice == 1) {
				await this.xmppChatDatasource?.getContacts();
			}
			rl.close();
			this._chatPrompt();
		});

	}

	private _showMenu() {
		console.log(`
		1. Show roster
		2. Add contact
		3. Remove contact
		4. Show contact details
		5. Chat
		6. Logout
		100. Remove account
	`);
	}
}