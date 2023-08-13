export class User {
	jid: string;
	name: string;
	status?: string;
	resource?: string;

	constructor(
		jid: string,
		name: string,
		status: string = 'offline',
		// resource: string
	) {
		this.jid = jid;
		this.name = name;
		this.status = status;
		// this.resource = resource;
	}
	

	public toString() {
		return `${this.jid} - ${this.status}`;
	}
}