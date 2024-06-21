On initialise dans le dossier chat-backend un projet NPM et on y installe
express, socket.io cors et nodemon

  npm init -y
  npm i express socket.io cors nodemon

Ensuite on va créer un fichier app.js et on va créer un script "start"
dans package.json :

  'start' : 'nodemon app.js'

Une fois le backend initialisé, nous allons mettre en place le front, donc,
  dans le dossier front :

    npm create vite@latest

Il faudra installer un projet REACT en utilisant JAVASCRIPT. Une fois le projet initialisé.
On peut tapper les commandes suivantes :

  npm install
  npm run dev
  npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
  npm install socket.io-client