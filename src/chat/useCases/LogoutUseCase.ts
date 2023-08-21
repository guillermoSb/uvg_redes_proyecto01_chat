import { ChatDatasource } from '../domain/datasources/ChatDatasource';

/**
 * Logout from the chat
 */
export class LogoutUseCase {
	public chatDatasource: ChatDatasource;

	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	/**
	 * Logout from the chat
	 */
	public async execute() {
		await this.chatDatasource.logout();
	}
}