FROM node

WORKDIR /bbt

COPY package.json /bbt/package.json
COPY package-lock.json /bbt/package-lock.json
RUN npm install
COPY . /bbt

RUN ./bupdate.js 

EXPOSE 9005

CMD node src/bbt.js
