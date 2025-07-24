<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

Simple JWT Authorization Nest app.
Refresh tokens are stored in Redis, Users are store in Postgres.
Databases are dockerized, all enviroment variables stored in .env.

## Compile and run the project

1) Run project
   
```bash
# install dependencies
$ npm install

# up databases
$ docker_compose up

# push schemas
$ npx drizzle-kit push

# start app
$ npm run start
```
2) Test API
   1. Go to
      
      https://documenter.getpostman.com/view/22855600/2sB34oBxMV
      
   2. Press "Run in Postman"
   3. Set enviroment to Manticore
   4. Run all endpoints
   5. Make sure that auth/login sents {{token}} = access_token 
    
## Run tests

```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## Minimum requirements

It should be written in TypeScript which compiles and runs ☑️

It has a cool name (Nest logo is red cat... and authentication service its like a guardian...thats why...ah, whatever....) ☑️

It does what it is supposed to do ☑️

Code should be covered by tests (jest and supertest) - coverage 70 - 80% (71%) ☑️

It should use some ORM: Drizzle ☑️

It must be implemented with Nest.js ☑️

It is required to use ioredis npm package ☑️

It should be a web-based API service (3 endpoints) ((+/refresh)) ☑️

It should use postgres and Redis ☑️

It should be organized for easy compilation and packaging with npm or yarn ☑️

Add docker-compose file to run database instance and Redis ☑️

Host it on github and provide access for review ☑️
