const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
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
      console.log(users[user][eml])
      if (email === users[user][eml]) {
        console.log("found")
        return users[user].id
      }
    }
  }
}

function urlsForUser(id) {
  urls = []
  for (url in urlDatabase) {
    if (urlDatabase[url].id === id) {
      urls.push(url)
    }
  } return urls
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
  let templateVars = { urls: urlDatabase, user: users[userid]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const tinyString = generateRandomString();
  urlDatabase[tinyString].longURL = req.body.longURL
  urlDatabase[tinyString]["userID"] = req.cookies.user_id
  res.redirect("/urls/"+tinyString);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL
  urlDatabase[tinyString]["userID"] = req.cookies.user_id
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const userid = req.cookies.user_id
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[userid]}
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]]}
  res.render("user_registration", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  if (emailExists(req.body.email)) {
    res.status(400).send("Email already exists")
  } else if (!req.body.email || !req.body.password) {
    res.status(400).send("Enter valid email and/or password");
  } else {
    users[id] = {
      id,
      email: req.body.email,
      password: req.body.password
    }
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
})


app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]]}
  res.render("user_login", templateVars)
})

app.post("/login", (req, res) => {
  const userID = getUserByEmail(req.body.email)
  if (!userID) {
    res.status(403).send("No user with specified email found");
  }
  if (!(users[userID].password === req.body.password)) {
    res.status(403).send("Incorrect Password")
  } else if (userID && users[user].password === req.body.password) {
    req.cookies.userID
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});
