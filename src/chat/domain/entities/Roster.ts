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
	 * Update an user status.
	 * @param jid 
	 * @param status 
	 */
	public setUserStatus(jid: string, status: string) {
		const user = this.users.find((user) => user.id === jid);
		if (!user) {
			this.users.push(new User(jid, '', status));
		}
		if (user) {
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


	/**
	 * Creates an instance of the roster with the new users.
	 * @param users 
	 * @returns {Roster}
	 */
	public copyWith(users: User[]): Roster {
		return new Roster(users);
	}
}