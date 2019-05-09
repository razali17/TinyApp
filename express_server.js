const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    for email in users[user] {
      if (email === users[user][email]) {
        return users[user]
      }
    }
  }
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user = getuser(req.cookie("user-id"))};
  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user = getuser(req.cookie("user-id"))};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  tinyString = generateRandomString();
  urlDatabase[tinyString] = req.body.longURL
  res.redirect("/urls/"+tinyString);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user = getuser(req.cookie("user-id"))};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  res.render("user_login");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  console.log(checkValidEmail(req.body.email));
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

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect('/urls/shortURL')

});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect("/urls/");
});

app.get("'login", (req, res) => {
  res.render("user_login")
})


  // res.cookie("user_id", )
  // res.redirect("/urls");

// app.post("/login", (req, res) => {
//   const userID = getuser(req.body.email);


//   }
//   res.cookie("user_id", id);
// })

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email)
  if (!user) {
    res.status(403).send("No user with specified email found");
  }
  if (!(user.password === req.body.password)) {
    res.status(403).send("Incorrect Password")
  } ekse if (user && user.password === req.body.password) {
  res.cookie("user_id", id)
  res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});
