
/**
 * An user of the chat
 */
export class User {
	jid: string;
	name: string;
	status?: string;
	resources: string[];

	constructor(
		jid: string,
		name: string,
		status: string = 'offline',
		resources: string[] = []
	) {
		this.jid = jid;
		this.name = name;
		this.status = status;
		this.resources = resources;
	}
	

	/**
	 * String representation of the user.
	 * @returns {string}
	 */
	public toString(): string {
		return `${this.jid} - ${this.status}`;
	}
}