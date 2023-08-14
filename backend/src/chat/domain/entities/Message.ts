
/**
 * Message that can be sent or received.
 */
export class Message {
	from: string;
	to: string;
	body: string;
	type: string;

	constructor(
		from: string,
		to: string,
		body: string,
		type: string = 'chat'
	) {
		this.from = from;
		this.to = to;
		this.body = body;
		this.type = type;
	}

	/**
	 * String representation of the message.
	 * @returns {string}
	 */
	public toString(): string {
		return `${this.from} - ${this.body}`;
	}

}