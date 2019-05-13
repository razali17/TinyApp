const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
/* Helper Funciton
Requires a user id as a parameter and
retrieves all the url's belonging to the specified user.
*/
function urlsForUser(id) {
  const urls = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === id) {
      urls[shortUrl] = {longURL: urlDatabase[shortUrl].longURL};
    }
  } return urls;
}

/* Helper Function
Generates a random id for a given user
*/
function generateRandomString() {
  let result = '';
  let chars = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890';
  let charsLen = chars.length;
  for (let i = 0; i < 6; i ++) {
    result += chars.charAt(Math.floor(Math.random() * charsLen));
  }
  return result;
}

/* Helper Funciton
Takes in a user email as a parameter and
checks whether the given email is contained in the users database.
*/
function emailExists(email) {
  for (let user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
}

/* Helper Funciton
Requires a user email as a paramater and returns the user's
information stored in the users database.
*/
function getUserByEmail(email) {
  for (let user in users){
    for (let eml in users[user]) {
      if (email === users[user][eml]) {
        return users[user].id;
      }
    }
  }
}

app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls")
  } else {
    let templateVars = { user: users[req.session.user_id]};
    res.render("user_registration", templateVars);
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  //use helpfer function to check if user exists with given email
  if (emailExists(req.body.email)) {
    res.status(400).send("Email already exists");
  } else if (!req.body.email || !req.body.password) {
    res.status(400).send("Enter valid email and/or password");
  } else {
    users[id] = {
      id,
      email: req.body.email,
      password: hashedPassword
    }
    req.session.user_id = users[id].id;
    res.redirect("/urls");
  }
})

app.get("/login", (req, res) => {
  if ((req.session.user_id)) {
    res.redirect("/urls")
  } else {
    let templateVars = { user: users[req.session]};
    res.render("user_login", templateVars);
  }
})

app.post("/login", (req, res) => {
  const uID = getUserByEmail(req.body.email);
  if (!uID) {
    res.status(403).send("No user with specified email found");
  }
  if (!(bcrypt.compareSync(req.body.password, users[uID].password))) {
    res.status(403).send("Incorrect Password");
  } else if (uID && (bcrypt.compareSync(req.body.password, users[uID].password))) {
    req.session.user_id = users[uID].id;
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  let userid = req.session.user_id;
  if (userid) {
    let userUrls = urlsForUser(userid);   //use helpfer function to retreive the user's URLS
    let templateVars = { urls: userUrls, user: users[userid]};
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send("User not logged in");
  }
});

app.post("/urls", (req, res) => {
  let userid = req.session.user_id;
  if (userid) {
    //generate a random id for the user using the helper function
    const tinyString = generateRandomString();
    urlDatabase[tinyString] = {longURL: req.body.longURL, userID:req.session.user_id};
    res.redirect("/urls/"+tinyString);
  } else {
    res.status(401).send("You are not logged in")
  }
});

app.get("/urls/new", (req, res) => {
  let userid = req.session.user_id;
  if (userid) {
    let templateVars = { user: users[userid] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else if (req.session.user_id) {
    res.staus(403).send("You do not have permission to perform this action")
  } else {
    res.status(401).send("Please log in")
  }
});

app.post("/urls/:shortURL", (req, res) => {
  /* Check if client's cookie matches the user id for the short URL in the database. If so, allow
  the user to submit a new long URL */
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    urlDatabase[req.params.shortURL].userID = req.session.user_id;
    res.redirect("/urls");
  } else if (req.session.user_id) {
    res.status(403).send("You do not have permission to edit this url")
  } else {
    res.status(401).send("Please log in")
  }
});

app.get("/urls/:shortURL", (req, res) => {
  /* Check if client's cookie matches the user id for the short URL in the database. If so,
  show the url index for the given user. */
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID){
    if (req.params.shortURL in urlDatabase) {
      let userid = req.session.user_id;
      let templateVars = { shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL, user: users[userid]};
      res.render("urls_show", templateVars);
    } else {
      res.status(404).send("Not a valid short URL");
    }
  } else if (!(req.session.user_id === urlDatabase[req.params.shortURL].userID)) {
    res.status(403).send("This url is unavailable to you")
  } else {
    res.status(401).send("User not logged in")
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    let shortURL = urlDatabase[req.params.shortURL];
    let longURL = shortURL.longURL;
    res.redirect(longURL);
  } else {
    res.status(400).send("Not a valid short url")
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
