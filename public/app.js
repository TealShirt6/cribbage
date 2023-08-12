 // Import the functions you need from the SDKs you need

 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
 import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js"
 import { getDatabase, onValue, update, connectDatabaseEmulator, ref, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"
 

 // Your web app's Firebase configuration
 const firebaseConfig = {
   apiKey: "AIzaSyCRzu5C9kjyaTQOnzqMRuAfp9khSe4RDzI",
   authDomain: "onlinecribbage-default-rtdb.firebaseapp.com",
   databaseURL: "https://onlinecribbage-default-rtdb.firebaseio.com",
   projectId: "onlinecribbage",
   storageBucket: "onlinecribbage.appspot.com",
   messagingSenderId: "990205738272",
   appId: "1:990205738272:web:fa8f3a695747bab0846b45",
 };
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const auth = getAuth()
 // Initialize Realtime Database and get a reference to the service
 const db = getDatabase(app)

// if (location.hostname === "localhost") {
// // Point to the RTDB emulator running on localhost.
// console.log("Connecting to Database Emulator")
// connectDatabaseEmulator(db, "127.0.0.1", 9000);
// } 

// Once user is authenticated, attatch onValue listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    onValue(gameRef, handleChange)
  }
});
signInAnonymously(auth)

// Helper functions
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function XOR(a, b) {
  return (a || b) && !(a && b)
}
const colors = ["#fc89d0", "#f37a5c", "#f3f05c", "#5cdcf3", "#8af16e", "#9249ec"]

function createName() {
  const prefix = randomFromArray([
    "COOL",
    "SUPER",
    "HIP",
    "SMUG",
    "COOL",
    "SILKY",
    "GOOD",
    "SAFE",
    "DEAR",
    "DAMP",
    "WARM",
    "RICH",
    "LONG",
    "DARK",
    "SOFT",
    "BUFF",
    "DOPE",
  ]);
  const animal = randomFromArray([
    "BEAR",
    "DOG",
    "CAT",
    "FOX",
    "LAMB",
    "LION",
    "BOAR",
    "GOAT",
    "VOLE",
    "SEAL",
    "PUMA",
    "MULE",
    "BULL",
    "BIRD",
    "BUG",
  ]);
  return `${prefix} ${animal}`;
}

var deck = (function() {
  const values = ["2","3","4","5","6","7","8","9","10","ace","jack","king","queen"]
  const suites = ["clubs","diamonds","hearts","spades"]
  return [...Array(52)].map(function(_, i) {
    return `${suites[Math.floor(i/13)]}_${values[i%13]}`
})
})()

function shuffle() {
  for (let i = 0; i < 13; i++)
  {
      let randIndex = Math.floor(Math.random() * (52 - i)) + i
      let temp = deck[i]
      deck[i] = deck[randIndex]
      deck[randIndex] = temp
  }
}

function createCardElement(card) {
  const el = document.createElement("img")
  el.src = `images/${card}.svg`
  el.classList.add("card")
  return el
}

function addName(player) {
  let el = document.createElement("div")

  let name = document.createElement("h2")
  name.classList.add("Character_name-container")
  name.style = `background-color: ${player.color};`
  name.innerText = player.name      

  let points = document.createElement("h2")
  points.classList.add("points")
  points.innerText = player.points

  if (player.id === meId) {
    name.contentEditable = true
    name.addEventListener("blur", ()=> {
      const updates = {}
      updates[`players/${meId}/name`] = name.innerText
      disconnectUpdates[`playerSave/${meId}/name`] = name.innerText
      onDisconnect(gameRef).cancel()
      onDisconnect(gameRef).update(disconnectUpdates)
      update(gameRef, updates)
    })
    points.contentEditable = true
    points.addEventListener("blur", ()=> {
      const updates = {}
      disconnectUpdates[`playerSave/${meId}/points`] = points.innerText
      onDisconnect(gameRef).cancel()
      onDisconnect(gameRef).update(disconnectUpdates)
      updates[`players/${meId}/points`] = points.innerText
      update(gameRef, updates)
    })
  }

  el.appendChild(name)
  el.appendChild(points)
  document.getElementById("sidebar").prepend(el)
  points.style.width = `${points.clientHeight - 4}px`
  return el
}

function getOpponent(players) {
  return players[Object.keys(players).find(player => player != meId)]
}

const Game = {
  clear: "clear",
  selectCrib: "selectCrib",
  play: "play",
  showCrib: "showCrib"
}

const gameRef = ref(db)

const nameElements = {}
const handElement = document.getElementById("hand")
const playElement = document.getElementById("play")
const nextElement = document.getElementById("next")

let game
let disconnectUpdates = {}
let meId
let opponent = null
let selectedCards = []

function clear() {
  const updates = {
    crib: [],
    play: [],
    savedHand: [],
    starter: null,
    gameState: Game.clear
  }
  for (const playerId in Object.keys(nameElements)) {
    updates[`players/${playerId}/hand`] = []
  }
  update(gameRef, updates)
}

// Goes to the next stage of the game, button should be dissabled when that is not an option
// Guard clause to confirm it is possible
function next() {
  const updates = {}
  switch (game.gameState) {
    case Game.clear:
      // Dealing

      shuffle()
      // updates = { 
      //   starter: deck[12], 
      //   gameState: Game.selectCrib
      // }
      updates.starter = deck[12]
      updates.gameState = Game.selectCrib
      updates[`players/${meId}/hand`] = deck.slice(0, 6)

      // Enables dealing without both players being online
      if (opponent != null) {
        updates[`players/${opponent.id}/hand`] = deck.slice(6, 12)
      } else {
        updates.savedHand = deck.slice(6, 12)
      }

      break
    case Game.selectCrib: 
      // Adding to Crib

      // Only add to crib if 2 cards are selected
      if (selectedCards.length != 2 ) { return }
      updates.crib = (game.crib || []).concat(selectedCards) 

      // Already cards in crib
      // Second person to add to crib 
      // Crib is full, time to play
      if (game.crib != null) {
        updates.gameState = Game.play
      }
      updates[`players/${meId}/hand`] = game.players[meId].hand.filter(card => !selectedCards.includes(card))
      selectedCards = []

      // Update to represent the next action to be taken in the game stage which you just progressed to
      nextElement.disabled = true
      nextElement.innerText = "Show Crib"

      break
    case Game.play:
      // Showing crib

      // Check if any hand still has cards
      if (Object.values(game.players).reduce((accumulator, player) => accumulator || player.hand, false)) { return }

      updates.gameState = Game.showCrib

      break
    case Game.showCrib:
      return
      break
  }
  update(gameRef, updates)
}

// Assigning click actions here because functions not acessible in the html due to it being a module script
document.getElementById("clear").onclick = clear
nextElement.onclick = next

function initUser(user) {
  meId = user.uid

  const updates = {}
  let me = {
    id: user.uid,
    name: createName(),
    color: randomFromArray(colors),
    points: 0
  }

  const meSave = game.playerSave?.[meId]
  if (meSave !== undefined) {
    me.points = meSave.points
    me.name = meSave.name
  }

  // I am the second Player to join
  if (game.savedHand !== undefined) {
    me.hand = game.savedHand
    updates.savedHand = null
  }

  nameElements[meId] = addName(me)

  // When I disconnect clear game whether other player there or not
  disconnectUpdates = {
    crib: [],
    play: [],
    savedHand: [],
    starter: null,
    gameState: Game.clear
  }
  disconnectUpdates[`players/${meId}`] = null
  disconnectUpdates[`playerSave/${meId}/points`] = me.points
  disconnectUpdates[`playerSave/${meId}/name`] = me.name

  onDisconnect(gameRef).update(disconnectUpdates)
  updates[`players/${meId}`] = me
  update(gameRef, updates)
}

// Works on a SwiftUIesque approach where the UI updates to represent the model, in this case a database
// Also has if conditionals to check for what has changed 
function handleChange(snap) {
  const oldGame = game
  game = snap.val()

  console.log(oldGame)
  console.log(game)

  if (meId === undefined) {
    if (Object.keys(game.players || {}).length == 2) {
      location.href = "error.html?error=Two%20Players%20Already%20Online"
    } else {
      initUser(auth.currentUser)
    }
    return
  }
  
  // We were disconnected and removed
  if (game.players?.[meId] === undefined) {
    location.href = "error.html?error=Disconnected"
    return
  }

  if ((oldGame?.players != undefined) && (Object.keys(game.players).length != Object.keys(oldGame.players).length)) {
    // New player online
    if (opponent == null) {
      opponent = getOpponent(game.players)
      nameElements[opponent.id] = addName(opponent)
    } else {
      nameElements[opponent.id].remove()
      delete nameElements[opponent.id]
      opponent = null
    }
  }

  // Update name labels with points and names
  for (const playerId in game.players) {
    const el = nameElements[playerId]
    el.querySelector(".points").innerText = game.players[playerId].points
    el.querySelector(".Character_name-container").innerText = game.players[playerId].name
  }

  // Actions to take the first time entering a game state
  if (game.gameState != oldGame.gameState || oldGame.players?.[meId] === undefined) {

    switch(game.gameState) {
      case Game.clear:
        // Clear all cards on
        handElement.innerHTML = ""
        playElement.innerHTML = ""
        nextElement.disabled = false
        nextElement.innerText = "Deal"
        document.getElementById("starter").src = "images/back.jpg"
        document.getElementById("starter").classList.add("back")
        break
      case Game.play:
        document.getElementById("starter").src = `images/${game.starter}.svg`
        document.getElementById("starter").classList.remove("back")
        break
      case Game.selectCrib:
        nextElement.innerText = "Add to Crib"
        nextElement.disabled = true
        break
      case Game.showCrib:
        nextElement.disabled = true
  
        // Rewrite the play grid with the crib cards
        playElement.innerHTML = ""
        for (const card of game.crib) {
          playElement.appendChild(createCardElement(card))
        }
        break
    }
  }

  switch (game.gameState) {
    case Game.play:
      playElement.innerHTML = ""

      // Or logical operation all hands together, true wins and indicates someone is still holding onto cards
      if (!Object.values(game.players).reduce((accumulator, player) => accumulator || player.hand, false)) { 

        // Can now show crib
        nextElement.disabled = false
      }
      for (const card of (game.play || [])) {
        if (card === "go") {
          playElement.appendChild(document.createElement("div"))
          continue
        }
        playElement.appendChild(createCardElement(card))
      }
  
    case Game.selectCrib:

      //Write new cards
      handElement.innerHTML = ""
      for (const card of (game.players[meId].hand || [])) {
        let cardElement = createCardElement(card)
        cardElement.classList.add("hand")
        if (selectedCards.includes(card)) {
          cardElement.classList.add("selected")
        }

        function select() {
          cardElement.classList.toggle("selected")

          // Toggle inclusion of card in selectedCards list
          let index = selectedCards.indexOf(card)
          if (index === -1) {
            selectedCards.push(card)
          }
          else
          {
            selectedCards.splice(index, 1)
          }

          // See if the selection makes the correct amount to add to the crib
          if (selectedCards.length == 2) {
            nextElement.disabled = false
          }
          else
          {
            nextElement.disabled = true
          }
        }

        function play() {
          const updates = {}

          // Manage playing multiple cards subsequently arranges them on the same row
          if (game.play == null) {
            updates.firstPlayed = meId
            updates.play = [card]
          } else {
            const cardsPlayed = game.play.length
            const playTwice = XOR(cardsPlayed % 2 === 0, game.firstPlayed === meId)
            updates.play = game.play.concat(playTwice ? ["go", card] : card)
          }
          updates["players/" + meId + "/hand"] = game.players[meId].hand.filter(x => x != card)
          update(gameRef, updates)
        }

        cardElement.addEventListener("click", game.gameState === "selectCrib" ? select : play)        

        handElement.appendChild(cardElement)          
      }
      break
  }
}
