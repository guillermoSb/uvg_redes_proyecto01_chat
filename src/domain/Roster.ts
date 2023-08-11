import { User } from './User';

export class Roster {
	users: User[];
	
	constructor(users: User[]) {
		this.users = users;
	}


	/**
	 * Update an user status
	 * @param jid 
	 * @param status 
	 */
	public setUserStatus(jid: string, status: string) {
		const user = this.users.find((user) => user.jid === jid);
		if (!user) {
			this.users.push(new User(jid, '', status));
		}
		if (user) {
			user.status = status;
		}
	}

	// Override toString() method

	public toString() {
		return '\n' + this.users.map((user) => user.toString()).join('\n');
	}
}