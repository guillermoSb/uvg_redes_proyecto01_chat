
/**
 * An user of the chat
 */
export class User {
	id: string;
	name: string;
	connectionStatus?: string;
	status?: string;
	constructor(
		id: string,
		name: string,
		connectionStatus: string = 'offline',
		status?: string 
	) {
		this.id = id;
		this.name = name;
		this.connectionStatus = connectionStatus;
		this.status = status;
	}
	

	/**
	 * String representation of the user.
	 * @returns {string}
	 */
	public toString(): string {
		let userToString = `${this.id} - ${this.connectionStatus}`;
		if (this.status) {
			userToString += ` - ${this.status}`;
		}
		return userToString;
	}
}