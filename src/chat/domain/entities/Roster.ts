import chalk from 'chalk';
import { User } from './User';
import { table } from 'table';


export class Roster {
	users: User[];	
	
	constructor(users: User[]) {
		this.users = users;
	}

	/**
	 * Removes an user from the roster.
	**/
	public removeUserFromRoster(jid: string) {
		this.users = this.users.filter((user) => user.id !== jid);
	}

	/**
	 * Add an user to the roster
	 * @param user 
	 */
	public addUserFromRoster(user: User) {
		// Check if the user is already in the roster
		const userIndex = this.users.findIndex((u) => u.id === user.id);
		if (userIndex === -1) {
			this.users.push(user);
		}
	}


	/**
	 * Update an user status.
	 * @param jid 
	 * @param connectionStatus 
	 * @param status 
	 */
	public setUserConnectionStatus(jid: string, connectionStatus: string, status?: string) {

		// ignore any jid from groupchat
		if (jid.includes('@conference')) {
			return;
		}
		
		// console.log('SETTING CONNECTION STATUS', jid, connectionStatus, status);
		const user = this.users.find((user) => user.id === jid);
		if (!user) {
			this.users.push(new User(jid, '', connectionStatus, status));
		}
		if (user) {
			user.connectionStatus = connectionStatus;
			user.status = status;
		}
	}


	/**
	 * Get an user from the roster
	 * @param jid 
	 */
	public getUserFromRoster(jid: string): User | undefined {
		return this.users.find((user) => user.id === jid);

	}

	/**
	 * String representation of the roster.
	 * @returns {string}
	 */
	public toString(): string {
		const data = [
			'JID',
			'Name',
			'Connection Status',
			'Status'
		]
		// statuses: chat, away, xa, dnd
		
		const users = this.users.map((user) => {
			let connectionStatus;
			if (user.connectionStatus === 'online') {
				connectionStatus = chalk.greenBright('online');
			} else if (user.connectionStatus === 'away') {
				connectionStatus = chalk.yellowBright('away');
			} else if (user.connectionStatus === 'xa') {
				connectionStatus = chalk.yellowBright('extended away');
			} else if (user.connectionStatus === 'dnd') {
				connectionStatus = chalk.redBright('do not disturb');
			} else {
				connectionStatus = chalk.redBright('offline');
			}
			return [
				user.id,
				user.name ?? '',
				connectionStatus,
				user.status ?? ''
			]
		});


		
		return `\n${table([data, ...users], {
			header: {
				content: chalk.green('Roster'),
			}
		})}\n`;
		
	}

}