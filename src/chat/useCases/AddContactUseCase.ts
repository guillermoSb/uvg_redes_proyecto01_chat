import { ChatDatasource } from '../domain/datasources/ChatDatasource';

/**
 * Add a contact to the roster
 */
export class AddContactUseCase {
	public chatDatasource: ChatDatasource;

	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	/**
	 * Adds an user to the roster
	 * @param userId User id to be added
	 */
	public async execute(userId: string) {
		await this.chatDatasource.addContact(userId);
	}
}