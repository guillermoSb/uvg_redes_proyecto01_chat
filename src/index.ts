import { client, xml } from '@xmpp/client';


const SERVER_URL = 'alumchat.xyz';
const TEST_USER = 'san191517test2';
const TEST_PASSWORD = '12345678';



// //Attempting connection
// const client = XMPP.createClient({
// 	jid: `${TEST_USER}@${SERVER_URL}`,
	
// 	password: '12345678',
// 	// server: `${SERVER_URL}`,
	
// 	transports: {
// 		// bosh: `http://${SERVER_URL}:5222/http-bind`,
// 		websocket: `ws://${SERVER_URL}:5222/xmpp-websocket`,
// 	}
// });


// client.on('session:started', () => {
// 	console.log('session started');
// 	// client.getRoster();
// 	// client.sendPresence();
// });

// client.on('presence:error', () => {
// 	console.log('presence error');
// });



// client.on('stream:error', () => {
// 	console.log('error');
// });


// client.on('chat', msg => {
// 	client.sendMessage({
// 		to: msg.from,
// 		body: 'You sent: ' + msg.body
// 	});
// });

// client.connect();