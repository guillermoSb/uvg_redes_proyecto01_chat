import { ChatDatasource } from '../domain/datasources/ChatDatasource';


/**
 * Send message to a group
 */
export class SendMessageToGroupUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}
	
	/**
	 * Sends a message
	 * @param to 
	 * @param message 
	 */
	public async execute(to: string, message: string) {
		await this.chatDatasource.sendMessageToGroup(to, message);
	}
}