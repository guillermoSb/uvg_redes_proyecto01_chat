import { ChatDatasource } from '../domain/datasources/ChatDatasource';

export class SendMessageUseCase {
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
		await this.chatDatasource.sendMessage(to, message);
	}
}