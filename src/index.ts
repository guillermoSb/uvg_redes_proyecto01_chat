import { Client, client, xml, } from '@xmpp/client';
import readline from 'readline';
import debug from '@xmpp/debug';
import { RosterToUserListMapper } from './infrastructure/mapper/RosterMapper';


// -----------------  CONFIGURATION -----------------
const SERVER_URL = 'alumchat.xyz';
const TEST_USER = 'san191517test2';
const TEST_PASSWORD = '12345678';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// -----------------  CONFIGURATION -----------------


const initializeXmppClient = (username: string, password: string) => {
	xmpp = client({
		service: `xmpp://${SERVER_URL}`,
		domain: `${SERVER_URL}`,
		resource: 'macbook',
		username,
		password,
		
	});
	// debug(xmpp, true);
	xmpp.start().catch(console.error);

	xmpp.on('error', (err) => {
		console.error(err);
	});

	xmpp.on('offline', () => {
		console.log('offline');
	});

	xmpp.on('stanza', async (stanza) => {
		if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
			// console.log(stanza.toString());
			const roster = RosterToUserListMapper.fromXmppResponse(stanza);
			console.log(roster.toString());
		}
		// console.log('Incoming stanza: ', stanza.toString());
	});

	xmpp.on('online', async () => {
		await xmpp.send(xml('presence'));	// Send presence to all contacts
		chatPrompt();
	});
};

const chatPrompt = () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	console.log(`
		1. Get all contacts
		2. Add contact
		3. Remove contact
		4. Update status
		5. Exit
		100. Remove account
	`);

	rl.question('Enter your command: ', async (answer) => {
		console.log(`You entered: ${answer}`);
		rl.close();
		if (answer == '1') {
			await xmpp.send(xml('iq', {type: 'get'}, xml('query', {xmlns: 'jabber:iq:roster'})));
		}
		chatPrompt();
	});
};



// ----------------- Client  -----------------
let xmpp: Client;
initializeXmppClient(TEST_USER, TEST_PASSWORD);
// ----------------- Client  -----------------
