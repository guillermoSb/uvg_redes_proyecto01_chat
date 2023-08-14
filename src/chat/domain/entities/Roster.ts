import { User } from './User';

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
	 * String representation of the roster.
	 * @returns {string}
	 */
	public toString(): string {
		return '\n' + this.users.map((user) => user.toString()).join('\n');
	}

}