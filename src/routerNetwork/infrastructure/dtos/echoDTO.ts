// Generated by https://quicktype.io

export interface EchoDTO {
	type:    string;
	headers: Headers;
	payload: Payload;
}

export interface Headers {
	from: string;
	to:   string;
}

export interface Payload {
	timestamp1: string;
	timestamp2: string;
}