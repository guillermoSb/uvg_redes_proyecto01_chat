import { Client, client, xml, } from '@xmpp/client';
import readline from 'readline';
import debug from '@xmpp/debug';
import { RosterToUserListMapper } from './infrastructure/mapper/RosterMapper';
import { Roster } from './domain/Roster';


// -----------------  CONFIGURATION -----------------
const SERVER_URL = 'alumchat.xyz';
const TEST_USER = 'san191517test2';
const TEST_PASSWORD = '12345678';
const RESOURCE = 'macbook';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const currentRoster = new Roster([]);
// -----------------  CONFIGURATION -----------------


const initializeXmppClient = (username: string, password: string) => {
	xmpp = client({
		service: `xmpp://${SERVER_URL}`,
		domain: SERVER_URL,
		resource: RESOURCE,
		username,
		password,
		
	});
	// debug(xmpp, true);
	xmpp.start().catch(console.error);

	xmpp.on('error', (err) => {
		console.error(err);
	});

	xmpp.on('offline', () => {
		console.log('Goodbye!');
	});

	xmpp.on('stanza', async (stanza) => {
		if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
			const incomingRoster = RosterToUserListMapper.fromXmppResponse(stanza);
			const currentUsers = currentRoster.users;
			//Check if the user is already in the roster
			const newUsers = incomingRoster.users.filter((user) => !currentUsers.some(currentUser => currentUser.jid === user.jid));
			currentRoster.users = [...currentUsers, ...newUsers];
			currentRoster.users.map((currentRosterUser) => {
				const newUser = incomingRoster.users.find((incomingUser) => incomingUser.jid === currentRosterUser.jid);
				if (newUser) {
					currentRosterUser.name = newUser.name;
				}
				return currentRosterUser;
			});
			console.log(currentRoster.toString());
		} else if (stanza.is('presence')) {
			if (stanza.getAttr('from') !== TEST_USER + '@' + SERVER_URL + '/' + RESOURCE) {
				const from = stanza.getAttr('from').split('/')[0];
				currentRoster.setUserStatus(from, 'online');
			}
		}
		// console.log('Incoming stanza: ', stanza.toString());
	});

	xmpp.on('online', async () => {
		console.log('OPEN PROMPT');
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
			chatPrompt();
		} else if (answer == '5') {
			
			await xmpp.stop();
			return rl.close();
		}
		
	});
};



// ----------------- Client  -----------------
let xmpp: Client;
initializeXmppClient(TEST_USER, TEST_PASSWORD);
// ----------------- Client  -----------------
