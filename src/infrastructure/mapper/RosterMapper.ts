import  Element  from 'ltx/src/Element';
import { Roster } from '../../domain/Roster';
import { User } from '../../domain/User';
// import { User } from '../../domain/User';


interface XmppUser {
	attrs: object;
}

export class RosterToUserListMapper { 
	public static fromXmppResponse(response: Element): Roster {
		const users = response.getChild('query')?.children;
		console.log(users?.toString());
		if (!users) return new Roster([]);
		// check if users can be converted to an array of Element[]
		const userList = users
			.filter((user) => user as XmppUser)
			.map((user) => {
				const userAsElement = user as Element;

				const jid = userAsElement.attrs.jid;
				const name = userAsElement.attrs.name;
				return new User(jid, name);
			});
		
		return new Roster(userList);
		
	}
}