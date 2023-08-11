export class User {
	jid: string;
	name: string;

	constructor(
		jid: string,
		name: string,
	) {
		this.jid = jid;
		this.name = name;
	}

	public toString() {
		return `${this.jid}`;
	}
}