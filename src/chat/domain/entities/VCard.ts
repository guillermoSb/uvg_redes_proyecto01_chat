

// Vcard class
export class VCard {
		constructor(
				public name: string,
			public nick: string,
				public jid: string
		) { }
	
	public toString() {
		return `VCARD\n${this.name} (${this.nick})`;
	}
}