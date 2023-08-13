

/**
 * Define the methods that the data layer will implement
 */
export interface ChatDatasource {
	
	getContacts(): Promise<void>

	sendMessage(to: string, message: string): Promise<void>

	addContact(id: string): Promise<void>

	removeContact(id: string): Promise<void>
	
}