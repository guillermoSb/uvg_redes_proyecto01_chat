import { User } from './User';

export class Roster {
	users: User[];
	constructor(users: User[]) {
		this.users = users;
	}

	// Override toString() method

	public toString() {
		return '\n' + this.users.map((user) => user.toString()).join('\n');
	}
}