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
	

	public toString() {
		return `${this.jid} - ${this.status}`;
	}
}