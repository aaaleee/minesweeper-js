import Minesweeper from './minesweeper.js';

const serverUrl = "http://localhost:5000";
var ms = null;
var isLoggedIn = false;
var currentGameId = null;

var messages = null;

var loginFormButton = null;
var registerFormButton = null;
var logoutButton = null;

var loginForm = null;
var registerForm = null;

var loginButton = null;
var registerButton = null;

var gamesList = null;
var gameContainer = null;

var status = null;

const coveredCellStyle = "width:15px;height:15px;background:#7b7b7b;color:#7b7b7b;border: 1px solid #6a6a6a;";
const uncoveredCellStyle = "width:15px;height:15px;background:#bdbdbd;border: 1px solid #6a6a6a;";

function showRegister() {
    loginForm.style = "display: none;";
    registerForm.style = "";
    loginFormButton.style = "";
    registerFormButton.style = "display: none;";
    logoutButton.style = "display: none;";
}


function showLogin() {
    loginForm.style = "";
    registerForm.style = "display: none;";
    loginFormButton.style = "display: none;";
    registerFormButton.style = "";
    logoutButton.style = "display: none;";
}


function showLogout() {
    loginForm.style = "display: none;";
    registerForm.style = "display: none;";
    loginFormButton.style = "display: none;";
    registerFormButton.style = "display: none;";
    logoutButton.style = "";
}


function generateCell(row, column, value) {
    const cell = document.createElement("td");
    switch(value) {
        case -1 : cell.innerHTML = "💣";
        break;
        case "F" : cell.innerHTML = "🚩";
        break;
        case "?" : cell.innerHTML = "❓";
        break;
        default : cell.innerHTML = value;
    }
    cell.style = (value=="C") ? coveredCellStyle : uncoveredCellStyle;

    cell.addEventListener('click', function(){
        ms.clearCell(row, column).then(data => {
            refreshBoard(data.board);
            refreshStatus(data);
        });
    });

    cell.addEventListener('contextmenu', function(event){
        event.preventDefault();
        ms.toggleCell(row, column).then(data => {
            refreshBoard(data.board);
            refreshStatus(data);
        });
    });
    
    return cell;
}


function refreshBoard(data) {
    let previous = document.getElementById("currentBoard");
    let board = document.createElement("table");
    board.id = "currentBoard";
    for(var i=0;i<data.length;i++) {
        let row = document.createElement("tr");
        let rowData = data[i];
        for(var j=0;j<rowData.length;j++) {
            row.appendChild(generateCell(i,j,rowData[j]))
        }
        board.appendChild(row);
    }
    if(previous) {
        previous.replaceWith(board);
    } else {
        gameContainer.appendChild(board);
    }
    
}

function refreshStatus(data) {
    let newStatus = "<b>Status</b><br>";
    newStatus += "Mines Left: " + data.mines_left + "<br>";
    newStatus += "Outcome: " + data.status + "<br>";
    newStatus += "Started on: " + data.start_time + "<br>";
    if(data.end_time) {
        newStatus += "Ended on: " + data.end_time + "<br>";
    }
    
    status.innerHTML = newStatus;
}


function loadGame(gameId) {
    ms.loadGame(gameId).then(data => {
        if(data) {
            console.log("Game Loaded");
            console.log(data);
            currentGameId = data.id;
            refreshBoard(data.board);
            refreshStatus(data);
        }
    });
}


function generateGameButton(gameId) {
    var btn = document.createElement("BUTTON");
    if(gameId==-1) {
        btn.innerHTML = "Start a new Game";
        btn.addEventListener('click', startGame);
    } else {
        btn.innerHTML = "Resume game #"+gameId;
        btn.addEventListener('click', function(){
            loadGame(gameId);
        });
    }
    return btn;
}


function loadGames() {
    var allGames = document.createElement('ul');
    allGames.id = "all-games";
    ms.listGames().then(result => {
        if(result) {
            allGames.appendChild(generateGameButton(-1));
            result.forEach(gameData => {
                console.log(gameData);
                console.log(gameData["status"]);
                if(gameData["status"]=="started" && currentGameId!=gameData["id"]) {
                    allGames.appendChild(generateGameButton(gameData["id"]));
                }
            });
            gamesList.appendChild(allGames);
        }
    });
}


function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    console.log("Logging in as " + email);
    ms = new Minesweeper(serverUrl, email, password);
    ms.connect().then(result => {
        if(result) {
            isLoggedIn = true;
            messages.innerHTML = "Logged in as "+ email;
            showLogout();
            loadGames();
        } else {
            messages.innerHTML = "There was an error!";
        }
    });
}


function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    ms = new Minesweeper(serverUrl, email, password);
    ms.register().then(result => {
        if(result) {
            ms.connect().then(res => {
                if(res) {
                    isLoggedIn = true;
                    messages.innerHTML = "Logged in as "+ email;
                    showLogout();
                }
            });
            
        } else {
            messages.innerHTML = "There was an error!";
        }
    });
}


function logout() {
    isLoggedIn = false;
    ms = null;
    showLogin();
    gameContainer.innerHTML = "";
    gamesList.innerHTML = "";
    status.innerHTML = "";

}


function startGame() {
    ms.startNewGame(10, 10, 25).then(data => {
        refreshBoard(data.board);
        refreshStatus(data);
        currentGameId = data.id;
        console.log("New Game Started");
        console.log(data);
    });

}


document.addEventListener("DOMContentLoaded", function(){
    messages = document.getElementById("messages");

    loginFormButton = document.getElementById("login-form-button");
    registerFormButton = document.getElementById("register-form-button");

    loginForm = document.getElementById("login-form");
    registerForm = document.getElementById("register-form");
    
    loginFormButton.onclick = showLogin;
    registerFormButton.onclick = showRegister;

    logoutButton = document.getElementById("logout");
    logoutButton.onclick = logout;

    loginButton = document.getElementById("submit-login");
    loginButton.onclick = login;

    registerButton = document.getElementById("submit-register");
    registerButton.onclick = register;

    gamesList = document.getElementById("games");
    gameContainer = document.getElementById("game");

    status = document.getElementById("status");
});