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
        ms.clearCell(row, column).then(result => {
            refreshBoard(result.data.board);
            refreshStatus(result.data);
        });
    });

    cell.addEventListener('contextmenu', function(event){
        event.preventDefault();
        ms.toggleCell(row, column).then(result => {
            refreshBoard(result.data.board);
            refreshStatus(result.data);
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
    newStatus += "State: " + data.status + "<br>";
    if(data.start_time) {
        newStatus += "Started on: " + data.start_time + "<br>";
    }
    if(data.end_time) {
        newStatus += "Ended on: " + data.end_time + "<br>";
    }
    status.innerHTML = newStatus;
}


function loadGame(gameId) {
    ms.loadGame(gameId).then(result => {
        if(result.status==200) {
            console.log("Game Loaded");
            console.log(result.data);
            currentGameId = result.data.id;
            refreshBoard(result.data.board);
            refreshStatus(result.data);
            messages.innerHTML = "";
            loadGames();
        } else {
            displayError(result.data);
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
    var previousList = document.getElementById("all-games");
    var allGames = document.createElement('ul');
    ms.listGames().then(result => {
        if(result.status==200) {
            allGames.appendChild(generateGameButton(-1));
            console.log("Current ID is"+currentGameId);
            result.data.forEach(gameData => {
                if(gameData["status"]=="started" && currentGameId!=gameData["id"]) {
                    console.log("game data id is "+gameData["id"]);
                    allGames.appendChild(generateGameButton(gameData["id"]));
                }
            });
            if(previousList) {
                previousList.replaceWith(allGames);
            } else {
                gamesList.appendChild(allGames);
            }
            allGames.id = "all-games";
        }
    });
}

function displayError(data) {
    if(data) {
        messages.innerHTML = JSON.stringify(data);
    } else {
        messages.innerHTML = "An error has occurred";
    }
}


function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    console.log("Logging in as " + email);
    ms = new Minesweeper(serverUrl, email, password);
    ms.connect().then(result => {
        if(result.status==200) {
            isLoggedIn = true;
            messages.innerHTML = "Logged in as "+ email;
            showLogout();
            loadGames();
        } else {
            displayError(result.data);
        }
    });
}


function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    ms = new Minesweeper(serverUrl, email, password);
    ms.register().then(result => {
        if(result.status==200) {
            ms.connect().then(res => {
                if(res.status==200) {
                    isLoggedIn = true;
                    messages.innerHTML = "Logged in as "+ email;
                    showLogout();
                    loadGames();
                } else {
                    displayError(res.data);
                }
            });
        } else {
            messages.innerHTML = "There was an error while registering! make sure you don't already have an account!";
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
    ms.startNewGame(10, 10, 25).then(result => {
        refreshBoard(result.data.board);
        refreshStatus(result.data);
        currentGameId = result.data.id;
        console.log("New Game Started");
        console.log(data);
        loadGames();
        messages.innerHTML = "";
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