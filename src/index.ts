import { CLIChat } from './chat/presentation/CLIChat';
import net from 'net';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';	// Accept self-signed certificates


import readline from 'readline';

// Option 1 - login, 2 - register 3 - exit

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/**
 * Entrypoint for the chat
 */
const main = async () => {
	const cliChat = new CLIChat();	// Chat instance
	rl.question('1 - Login\n2 - Register\n3 - Exit\n', async (answer) => {
		rl.close();
		let choice = parseInt(answer);
		if (choice == 1) {
			cliChat.login();	// Start the chat
		} else if (choice == 2) {
			cliChat.register();	// Register user
		} else if (choice == 3) {
			process.exit(0);
		}
	});
}

main();	// Start the chat