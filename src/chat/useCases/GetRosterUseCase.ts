import { ChatDatasource } from '../domain/datasources/ChatDatasource';

/**
 * Request the Roster
 */
export class GetRosterUseCase {
	public chatDatasource: ChatDatasource;

	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	/**
	 * Request the roster
	 */
	public async execute() {
		await this.chatDatasource.getContacts();
	}

}