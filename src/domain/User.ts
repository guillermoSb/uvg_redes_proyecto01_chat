export class User {
	jid: string;
	name: string;
	status?: string;

	constructor(
		jid: string,
		name: string,
		status: string = 'offline'
	) {
		this.jid = jid;
		this.name = name;
		this.status = status;
	}
	

	public toString() {
		return `${this.jid} - ${this.status}`;
	}
}