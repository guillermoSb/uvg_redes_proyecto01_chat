import { ChatDatasource } from '../domain/datasources/ChatDatasource';


/**
 * Remove the account
 */
export class RemoveAccountUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}
	/**
	 * Remove account
	 */
	public async execute() {
		await this.chatDatasource.removeAccount();
	}
}