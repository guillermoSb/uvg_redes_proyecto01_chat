import { RouterSimulation } from './routerNetwork/RouterSimulation';
import { CLIChat } from './chat/presentation/CLIChat';
import net from 'net';
import chalk from 'chalk';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';	// Accept self-signed certificates


// import readline from 'readline';

// // Option 1 - login, 2 - register 3 - exit

// const rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout
// });

// /**
//  * Entrypoint for the chat
//  */
// const main = async () => {
// 	const cliChat = new CLIChat();	// Chat instance
// 	rl.question('1 - Login\n2 - Register\n3 - Exit\n', async (answer) => {
// 		rl.close();
// 		let choice = parseInt(answer);
// 		if (choice == 1) {
// 			cliChat.login();	// Start the chat
// 		} else if (choice == 2) {
// 			cliChat.register();	// Register user
// 		} else if (choice == 3) {
// 			process.exit(0);
// 		}
// 	});
// }

// main();	// Start the chat


// ! Lab 3.2

// load jid and password from process.argv

const jid = process.argv[2];
const password = process.argv[3];
const algorithm = process.argv[4];

if (algorithm != 'link-state' && algorithm != 'distance-vector') {
	console.log(chalk.red('Invalid algorithm, please use link-state or distance-vector'));
	process.exit(0);
}



const routerSimulation = new RouterSimulation(jid, password, algorithm);

(async () => {
	await routerSimulation.start(false);	// Remove the true to disable debug mode
})();


// Run program with npm start san191517 123456 link-state
// Change user, password and algorithm