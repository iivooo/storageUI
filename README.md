# storageUI
bachelor thesis prototype: article submission system with api based on ipfs and ipfs-cluster

## Setup

This project is node.js driven. Install it e.g. like this:  
`sudo curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -;`  
`sudo apt-get install -y nodejs;`

Afterwards set the global path for npm (node packet manager) to the userspace for permission issues:  
`mkdir ~/.npm-global;`  
`npm config set prefix '~/.npm-global';`  
`echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile;`  
`source ~/.profile;`

Now fetch this project to your server in any folder you like. A folder in the userspace is recommended due to permission issues:  
`git clone ...`

Now install all dependecies of the project. Go into the projects folder and hit:  
`npm install`

To start the instance you can either run the native node server or use e.g. forever:  
`npm install -g --save forever`  
`forever start bin/www`
