const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
app.use(cookieParser());
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

function urlsForUser(id) {
  urls = {}
  for (shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === id) {
      urls[shortUrl] = {longURL: urlDatabase[shortUrl].longURL}
    }
    console.log(urls)
  } return urls
}

function generateRandomString() {
  let result = '';
  let chars = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890';
  let charsLen = chars.length;
  for (let i = 0; i < 6; i ++) {
    result += chars.charAt(Math.floor(Math.random() * charsLen));
  }
  return result;
}

function emailExists(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return true
    }
  }
}

function getUserByID(userID) {
  for (user in users){
    if (userID === users[user]) {
      return users[user]
    }
  }
}

function getUserByEmail(email) {
  for (user in users){
    for (eml in users[user]) {
      if (email === users[user][eml]) {
        return users[user].id
      }
    }
  }
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls/new", (req, res) => {
  const userid = req.cookies.user_id
  if (userid) {
    let templateVars = { user: users[userid] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get("/urls", (req, res) => {
  const userid = req.cookies.user_id
  if (userid) {
    const userUrls = urlsForUser(userid)
    let templateVars = { urls: userUrls, user: users[userid]};
    res.render("urls_index", templateVars);
  } else {res.redirect("/login")}
});

app.post("/urls", (req, res) => {
  const tinyString = generateRandomString();
  urlDatabase[tinyString] = {longURL: req.body.longURL, userID:req.cookies.user_id}
  res.redirect("/urls/"+tinyString);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls')
  } else res.send("You don't have permission")
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].userID) {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL
  urlDatabase[tinyString].userID = req.cookies.user_id
  res.redirect("/urls");
  } else res.send("You do not have permission")
});

app.get("/urls/:shortURL", (req, res) => {
  const userid = req.cookies.user_id
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userid]}
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = urlDatabase[req.params.shortURL]
  let longURL = shortURL.longURL;
  res.redirect("http://www."+longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id]}
  res.render("user_registration", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (emailExists(req.body.email)) {
    res.status(400).send("Email already exists")
  } else if (!req.body.email || !req.body.password) {
    res.status(400).send("Enter valid email and/or password");
  } else {
    users[id] = {
      id,
      email: req.body.email,
      password: hashedPassword
    }
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
})

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id]}
  res.render("user_login", templateVars)
})

app.post("/login", (req, res) => {
  const uID = getUserByEmail(req.body.email)
  if (!uID) {
    res.status(403).send("No user with specified email found");
  }
  if (!(bcrypt.compareSync(req.body.password, users[uID].password))) {
    res.status(403).send("Incorrect Password")
  } else if (uID && (bcrypt.compareSync(req.body.password, users[uID].password))) {
    res.cookie("user_id", users[uID].id)
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});
