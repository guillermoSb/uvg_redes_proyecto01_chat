import { Message } from './../domain/entities/Message';
import chalk from 'chalk';
import readline from 'readline';
import { XMPPChatDatasource } from '../infrastructure/datasources/XMPPChatDatasource';
import { Roster } from '../domain/entities/Roster';
import { RemoveAccountUseCase, GetRosterUseCase, AddContactUseCase, RemoveContactUseCase, UpdateStatusUseCase, JoinGroupUseCase, SendMessageUseCase, SendMessageToGroupUseCase, LogoutUseCase } from '../useCases/useCases';
import { VCard } from '../domain/entities/VCard';


/**
 * CLIChat
 */
export class CLIChat {
	xmppChatDatasource?: XMPPChatDatasource;
	roster: Roster = new Roster([]);
	currentConnectionStatus = 'chat';
	currentStatus = '';
	currentChat = '';
	contactTyping = false;
	groups = {};
	chats: Map<string, Message[]> = new Map();
	currentUser = '';
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

		this.xmppChatDatasource.onPresenceReceived = (jid: string, connectionStatus: string, status?: string) => {
			console.log(chalk.gray(`${jid} is now ${connectionStatus} ${status ? `(${status})` : ''}`))
		
			this.roster.setUserConnectionStatus(jid, connectionStatus, status);
		};

		this.xmppChatDatasource.onVcardReceived = (vcard: VCard) => {
				console.log('\n' +vcard.toString());
		}
		
		this.xmppChatDatasource.onMessageReceived = (from: string, message: string, type: string) => {
			const fromJid = from.split('/')[0];
			
			
			if (this.currentChat === fromJid) {
				if (type === 'chat') {	
					if (!this.chats.has(fromJid)) {
						this.chats.set(fromJid, []);
					}
					this.chats.get(fromJid)?.push(new Message(fromJid,this.currentUser, message, type));
					console.log(chalk.blueBright(`Message from ${from}: ${message}`));
					this.contactTyping = false;
				} else if (type === 'groupchat') {
					if (!this.chats.has(fromJid)) {
						this.chats.set(fromJid, []);
					}
					this.chats.get(fromJid)?.push(new Message(fromJid, this.currentUser, `${from}: ${message}`, type));
					console.log(chalk.blueBright(`Group Message from ${from}: ${message}`));
				} else if (type == 'composing') {
					if (!this.contactTyping) {
						console.log(chalk.gray(`${from} is typing...`));
						this.contactTyping = true;
					}
				} else if (type == 'paused') {
					if (this.contactTyping) {
						console.log(chalk.gray('Contact stopped typing...'));
						this.contactTyping = false;
					}
				} else {
					this.contactTyping = false;
				}
			} else {
				if (type == 'chat') {
					console.log(chalk.bgGray('\nNew private message from ' + fromJid))
					if (!this.chats.has(fromJid)) {
						this.chats.set(fromJid, []);
					}
					this.chats.get(fromJid)?.push(new Message(fromJid, this.currentUser, message, type));
				} else if (type == 'groupchat') {
					console.log(chalk.bgGray('\nNew group message on: ' + fromJid))
					if (!this.chats.has(fromJid)) {
						this.chats.set(fromJid, []);
					}
					this.chats.get(fromJid)?.push(new Message(fromJid, this.currentUser, `${from}: ${message}`, type));
				}
			}
			
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
				
				this.xmppChatDatasource = new XMPPChatDatasource(jid, password);	// ! For now, we are hardcoding the user and password
				this.currentUser = 'san191517test';
				this.configureXmppListeners();

				await this.xmppChatDatasource.start({ debugMode: false });
			});
		});
	}

	async register() {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question('Enter the username: ', async (username) => {
			
			rl.question('Enter your password: ', async (password) => {
				rl.close();
				this.xmppChatDatasource = new XMPPChatDatasource(username, password);
				this.xmppChatDatasource.register(username, password);
			});
		});
	}

	
	private _chatPrompt() {
		this.currentChat = '';
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		this._showMenu();
		rl.question('Enter your command: ', async (answer) => {
			const choice = parseInt(answer);
			if (choice == 11) {
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
					this.roster.removeUserFromRoster(contactJid + '@alumchat.xyz');
					await removeContactUseCase.execute(contactJid);
					return this._chatPrompt();
				});
			} else if (choice == 4) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the new status (chat, away, xa, dnd): ', async (connectionStatus) => {
					rl2.close();
					if (connectionStatus !== 'chat' && connectionStatus !== 'away' && connectionStatus !== 'xa' && connectionStatus !== 'dnd') {
						this._displayError('Invalid status');
						return this._chatPrompt();
					}
					this.currentConnectionStatus = connectionStatus;
					const updateStatusUseCase = new UpdateStatusUseCase(this.xmppChatDatasource!);
					await updateStatusUseCase.execute(this.currentConnectionStatus, this.currentStatus);
					return this._chatPrompt();
				});
			} else if (choice == 5) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter your new custom status: ', async (status) => {
					rl2.close();
					this.currentStatus = status;
					const updateStatusUseCase = new UpdateStatusUseCase(this.xmppChatDatasource!);
					await updateStatusUseCase.execute(this.currentConnectionStatus, this.currentStatus);
					return this._chatPrompt();
				});
			} else if (choice == 6) {
				// ask for an user to find on the roster
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the contact jid: ', async (contactJid) => {
					rl2.close();
					const user = this.roster.getUserFromRoster(contactJid + '@alumchat.xyz');
					if (user) {
						console.log(user.toString())
					}
					await this.xmppChatDatasource?.getVCard(contactJid);
					return this._chatPrompt();
				});
				
			} else if (choice == 7) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the contact jid: ', async (contactJid) => {
					rl2.close();
					this.currentChat = contactJid + '@alumchat.xyz';
					const chatHistory = this.chats.get(this.currentChat);
					for (const message of chatHistory ?? []) {
							if (message.from != this.currentUser) {
								console.log(message.toString());
							} else {
								console.log(`You: ${message.body}`);
							}
					}
					const chat = async (contactJid: string) => {
						const rl3 = readline.createInterface({
							input: process.stdin,
							output: process.stdout,
						});

						rl3.question('Enter your message (leave blank to exit): ', async (answer) => {
							if (answer === '') {
								rl3.close();
								return this._chatPrompt();
							}
							this.chats.get(this.currentChat)?.push(new Message(this.currentUser, this.currentChat, answer, 'chat'));
							rl3.close();
							const sendMessageUseCase = new SendMessageUseCase(this.xmppChatDatasource!);
							await sendMessageUseCase.execute(contactJid, answer);
							return chat(contactJid);
						});
					};
					return chat(contactJid);
				});
			} else if (choice == 8) {
				// ask for group jid and user Nick
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the group jid: ', async (groupJid) => {
					rl2.close();
					const rl3 = readline.createInterface({
						input: process.stdin,
						output: process.stdout,
					});
					rl3.question('Enter your nick: ', async (nick) => {
						rl3.close();
						const joinGroupUseCase = new JoinGroupUseCase(this.xmppChatDatasource!);
						await joinGroupUseCase.execute(groupJid, nick);
						return this._chatPrompt();
					});
				});
			} else if (choice == 9) {
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the group jid: ', async (contactJid) => {
					rl2.close();
					this.currentChat = contactJid + '@conference.alumchat.xyz';
					const chatHistory = this.chats.get(this.currentChat);
					for (const message of chatHistory ?? []) {
							if (message.from != this.currentUser) {
								console.log(message.toString());
							} else {
								console.log(`You: ${message.body}`);
							}
					}
					const chat = async (contactJid: string) => {
						const rl3 = readline.createInterface({
							input: process.stdin,
							output: process.stdout,
						});
						rl3.question('Enter your message (leave blank to exit): ', async (answer) => {
							if (answer === '') {
								rl3.close();
								return this._chatPrompt();
							}
							rl3.close();
							this.chats.get(this.currentChat)?.push(new Message(this.currentUser, this.currentChat, answer, 'groupchat'));
							const sendMessageUseCase = new SendMessageToGroupUseCase(this.xmppChatDatasource!);
							await sendMessageUseCase.execute(contactJid, answer);
							return chat(contactJid);
						});
					};
					return chat(contactJid);
				});
			} else if (choice == 10) {
				// ask for jid
				rl.close();
				const rl2 = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});
				rl2.question('Enter the contact jid: ', async (contactJid) => {
					rl2.close();
					const rl3 = readline.createInterface({
						input: process.stdin,
						output: process.stdout,
					});
					rl3.question('Enter the file name: ', async (fileName) => {
						rl3.close();
						const success = await this.xmppChatDatasource?.sendFile(contactJid, fileName);
						if (!success) {
							this._displayError('File not found');
						} else {
							console.log(chalk.green('File sent.'));
						}
						return this._chatPrompt();
					});
				}
				);
			}
			else if (choice == 100) {
				console.log(chalk.green('Removing account...'));
				const removeAccountUseCase = new RemoveAccountUseCase(this.xmppChatDatasource!);
				await removeAccountUseCase.execute();
				return rl.close();
			} else {
				console.log(chalk.redBright('Invalid option'));
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
		4. Update connection status
		5. Update custom status
		6. Show contact details
		7. Chat
		8. Join Group
		9. Chat in group
		10. Send file
		11. Logout
		100. Remove account
	`);
	}

	private _displayError(error: string) {
		console.error(chalk.redBright(error));
	}
}