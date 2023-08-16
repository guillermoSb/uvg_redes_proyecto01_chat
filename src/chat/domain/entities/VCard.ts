

// Vcard class
export class VCard {
		constructor(
				public name: string,
			public nick: string,
				public jid: string
		) { }
	
	public toString() {
		return this.name + " (" + this.nick + ") " + this.jid;
	}
}