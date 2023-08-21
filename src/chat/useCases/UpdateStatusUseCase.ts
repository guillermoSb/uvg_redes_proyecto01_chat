import { ChatDatasource } from '../domain/datasources/ChatDatasource';


/**
 * Update the user status
 */
export class UpdateStatusUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}
	
	/**
	* Adds an user to the roster
	* @param connectionStatus Status to be updated
	* @param status Status to be updated
	*/
	public async execute(connectionStatus: string, status: string) {
		await this.chatDatasource.updateStatus(connectionStatus, status);
	}
}