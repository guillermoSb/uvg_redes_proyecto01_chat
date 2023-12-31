

// Vcard definition
export class VCard {
		constructor(
				public name: string,
			public nick: string,
				public jid: string
		) { }
	
	// String representation
	public toString() {
		return `VCARD\n${this.name} (${this.nick})`;
	}
}