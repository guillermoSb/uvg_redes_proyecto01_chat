# Alumchat.xzy Typescript Client
Universidad del Valle de Guatemala - 2023 (Redes)
## How to run this project
1. Install npm dependencies `npm install`
2. Run the project `npm run start`
## Features of the project
- [x] Login
- [x] Register
- [x] Send messages
- [x] Receive messages
- [x] Group Chat
- [x] Custom status and presence updates
- [x] Add / Remove contacts

## About the project
The decission on typescript is based on the fact that it is a strongly typed language, which helps to avoid errors and makes the code more readable. It also has a lot of support and documentation. I decided to use [Clean Architecture](https://betterprogramming.pub/the-ultimate-clean-architecture-template-for-typescript-projects-e53936269bb9) as much as possible. The code is organized in: Domain, Infrastructure, Presentation and Use Cases.
### Domain
Contains datasources and entities. Datasources are the interfaces that define the methods that the infrastructure layer must implement. Entities are the objects that are used in the application.
### Infrastructure
Contains the implementation of the datasources defined in the domain layer. It also contains the implementation of the XMPP client.
### Presentation
Contains the implementation of the use cases. It also contains the implementation of the CLI.
### Use Cases
Contains the interfaces that define the methods that the presentation layer must implement.

## Author
Guillermo Santos Barrios - 191517
## References 
Saint-Andre, P., Smith, K., Tronçon, R., & Troncon, R. (2009). XMPP: The Definitive Guide. “O’Reilly Media, Inc.”


