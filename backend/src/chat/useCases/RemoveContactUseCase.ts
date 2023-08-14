import { ChatDatasource } from '../domain/datasources/ChatDatasource';


export class RemoveContactUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	/**
	 * Adds an user to the roster
	 * @param userId User id to be added
	 */
	public async execute(userId: string) {
		await this.chatDatasource.removeContact(userId);
	}
}