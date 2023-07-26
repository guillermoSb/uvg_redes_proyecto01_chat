
export abstract class UseCase<T> {
	/**
	 * Handle the use case
	 */
	protected abstract handle(): Promise<T>;

	/**
	 * Execute the use case
	 * @returns {Promise<T>}
	 */
	public async execute(): Promise<T> {
		const result = await this.handle();
		return result;
	}

}


 