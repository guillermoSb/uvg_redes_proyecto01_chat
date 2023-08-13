import chalk from 'chalk';
import readline from 'readline';
import { XMPPChatDatasource } from '../infrastructure/datasources/XMPPChatDatasource';
import { Roster } from '../domain/entities/Roster';
import { LogoutUseCase, GetRosterUseCase, AddContactUseCase, RemoveContactUseCase } from '../useCases/useCases';


/**
 * CLIChat
 */
export class CLIChat {
	xmppChatDatasource?: XMPPChatDatasource;
	roster: Roster = new Roster([]);


	/**
	 * Configure all listeners for the XMPP client
	 * @returns 
	 */
	configureXmppListeners() {
		if (!this.xmppChatDatasource) return;
		this.xmppChatDatasource.onOnline = async () => {
			console.log(chalk.green('You are now online'));
			this._chatPrompt();
		};
		this.xmppChatDatasource.onRosterReceived = async (roster: Roster) => {
			for (const user of roster.users) {
				this.roster.addUserFromRoster(user);
			}
			console.log(this.roster.toString());
		};
		this.xmppChatDatasource.onError = () => {};

		this.xmppChatDatasource.onLoginError = () => {
			console.log('Could not login, try again');
			this.login();
		};

		this.xmppChatDatasource.onPresenceReceived = (jid: string, status: string) => {
			this.roster.setUserStatus(jid, status);
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
				const logoutUseCase = new LogoutUseCase(this.xmppChatDatasource!);
				await logoutUseCase.execute();
				return rl.close();
			}

			if (choice == 1) {
				const getRosterUseCase = new GetRosterUseCase(this.xmppChatDatasource!);
				getRosterUseCase.execute();
				rl.close();
				return this._chatPrompt();
			} else if (choice == 2) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the contact jid: ', async (contactJid) => {
					const addContactUseCase = new AddContactUseCase(this.xmppChatDatasource!);
					await addContactUseCase.execute(contactJid);
					rl2.close();
					return this._chatPrompt();
				});
			} else if (choice == 3) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the contact jid: ', async (contactJid) => {
					rl2.close();
					const removeContactUseCase = new RemoveContactUseCase(this.xmppChatDatasource!);
					await removeContactUseCase.execute(contactJid);
					return this._chatPrompt();
				});
			} else {
				console.log(chalk.red('Invalid option'));
				rl.close();
				this._chatPrompt();
			}
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