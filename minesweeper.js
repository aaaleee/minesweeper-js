export default class Minesweeper {
    constructor(serverUrl, email, password) {
        this.serverUrl = serverUrl;
        this.email = email;
        this.password = password;
    }

    prepareRequest(path, method, data) {
        const url = this.serverUrl+path;

        const headers = {
            'Accept': 'application/json',
            "Content-Type": 'application/json'
        };

        if(this.token) {
            headers["x-access-tokens"] = this.token;
        }

        const payload = data ? JSON.stringify(data) : null;

        return new Request(url, {method: method, body: payload, headers: headers});
    }

    requiresAuth() {
        if(!this.serverUrl || !this.email || !this.password) {
            console.error("Missing request info, cannot continue")
            return false;
        }
        return true;
    }

    requiresToken() {
        if(!this.serverUrl || !this.token) {
            console.error("Missing request info, cannot continue");
            return false;
        }
        return true;
    }

    requiresGame() {
        if(!this.requiresToken() || !this.game) {
            console.error("Game not loaded properly");
            return false;
        }
        return true;
    }

    processError(status, data) {
        console.error('Server returned ' + status);
        if (data.message) {
            console.log(data.message);
        }
        return false;
    }

    async connect() {
        if(!this.requiresAuth()) {
            return false;
        }
        const request = this.prepareRequest('/authenticate', 'POST', {"email": this.email, "password": this.password});
        const response = await fetch(request);
        const data = await response.json();

        if (response.status === 200) {
            console.log('Got a token ' + data.token);
            this.token = data.token;
        } else {
            this.processError(response.status, data);
        }
        return {"status": response.status, "data": data};
    }

    async register() {
        if(!this.requiresAuth()) {
            return false;
        }
        const rdata = {"email": this.email, "password": this.password};
        const request = this.prepareRequest('/register', 'POST', rdata);
        const response = await fetch(request);
        const data = await response.json();
        
        if (response.status === 200) {
            await this.connect();
        } else {
            this.processError(response.status, data);
        }
        return {"status": response.status, "data": data};
    }

    async listGames() {
        if(!this.requiresToken()) {
            return false;
        }
        const request = this.prepareRequest('/games', 'GET');
        const response = await fetch(request);
        let data = await response.json();

        if(response.status === 200) {
            console.log('Games retrieved');
            console.log(data.games);
            data = data.games
        } else {
            this.processError(response.status, data);
        }
        return {"status": response.status, "data": data};
    }

    refreshGame(response, data) {
        if(response.status === 200) {
            this.game = data;
        } else {
            this.processError(response.status, data);
        }
        return {"status": response.status, "data": data};
    }

    async loadGame(id) {
        if(!this.requiresToken()) {
            return false;
        }
        if(!id) {
            return false;
        }
        const request = this.prepareRequest('/games/' + id, 'GET');
        const response = await fetch(request);
        const data = await response.json();

        return this.refreshGame(response, data);
    }

    isFinished() {
        if(!this.requiresGame()) {
            return false;
        }
        return this.game.status != "started";
    }

    async clearCell(row, column) {
        if(!this.requiresGame()) {
            return false;
        }
        const rdata = {"row": row, "column": column}
        const request = this.prepareRequest('/games/' + this.game.id + '/clear', 'POST', rdata);
        const response = await fetch(request);
        const data = await response.json();
        
        return this.refreshGame(response, data);
    }

    async toggleCell(row, column) {
        if(!this.requiresGame()) {
            return false;
        }
        const rdata = {"row": row, "column": column}
        const request = this.prepareRequest('/games/' + this.game.id + '/toggle', 'POST', rdata);
        const response = await fetch(request);
        const data = await response.json();
        
        return this.refreshGame(response, data);
    }
    
    async startNewGame(rows, columns, mines) {
        if(!this.requiresToken()) {
            return false;
        }
        const rdata = {"rows": rows, "columns": columns, "mines": mines}
        const request = this.prepareRequest('/games', 'POST', rdata);
        const response = await fetch(request);
        const data = await response.json();
        
        return this.refreshGame(response, data);
    }
}