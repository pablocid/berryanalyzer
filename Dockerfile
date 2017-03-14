FROM node:boron

RUN apt-get update
RUN apt-get install  -y bc git

RUN mkdir /usr/src/apps
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# Install app 
RUN git clone https://github.com/pablocid/berryanalyzer.git
WORKDIR /usr/src/app/berryanalyzer

RUN npm install

CMD [ "npm", "start" ]
