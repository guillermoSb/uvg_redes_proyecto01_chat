
/**
 * An user of the chat
 */
export class User {
	id: string;
	name: string;
	status?: string;
	resources: string[];

	constructor(
		id: string,
		name: string,
		status: string = 'offline',
		resources: string[] = []
	) {
		this.id = id;
		this.name = name;
		this.status = status;
		this.resources = resources;
	}
	

	/**
	 * String representation of the user.
	 * @returns {string}
	 */
	public toString(): string {
		return `${this.id} - ${this.status}`;
	}
}