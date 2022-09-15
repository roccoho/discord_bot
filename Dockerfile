FROM nikolaik/python-nodejs:python3.9-nodejs16

WORKDIR /discord_bot

COPY requirements.txt config.json deploy-command.js events.json package.json package-lock.json index.js ./
RUN pip install --no-cache-dir -r requirements.txt &&\ 
	npm install

CMD ["node", "index.js"]