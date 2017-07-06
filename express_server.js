const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true})); //this is middleware

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

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

app.use(function(req, res, next){
  res.locals.user = users[req.cookies.user_id];
  next();
});

function generateRandomString() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function checkUser(email) {
  // return !!(Object.values(users).find(user=>user.email === email);
  for(id in users) {
    if(email == users[id].email) {
      return true;
    }
  }
  return false;
}
// function getUserId(email) {
//   // return !!(Object.values(users).find(user=>user.email === email);
//   for(id in users) {
//     if(email == users[id].email) {
//       return id;
//     }
//   }
//   return undefined;
// }

function getUser(email) {
  // return !!(Object.values(users).find(user=>user.email === email);
  for(id in users) {
    if(email == users[id].email) {
      return users[id];
    }
  }
  return undefined;
}

app.get('/', (request,response)=> {
  response.json(urlDatabase);
});

app.get('/urls', (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id],
                        email: response.locals.user.email
                     };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const randString = generateRandomString();
  urlDatabase[randString] = req.body.longURL;
  console.log(req.body);  // debug statement to see POST parameters
  res.redirect(`urls/${randString}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect("/urls");
});

app.post("/login", (request,response) => {
  //check if passwords match
  //given email, return id
  const  {email, password} = request.body;
  const user = getUser(email);
  if(!user) {
    response.status(403).send("User does not exist. Please register")
  } else {
   savedPass = user.password;
    if(password == savedPass) {
      response.cookie('user_id', user.id);
      response.redirect("/urls");
    }
    else {
      response.redirect("/login");
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  return res.redirect(longURL);
});

app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect("/urls");
});

app.get("/login",(request, response) => {
  response.render("login");
})

app.get("/register", (request, response) => {
  response.render("register");
});

app.post("/register", (request, response) => {
  let randomString = generateRandomString();
  const {email, password} = request.body;
  if(!email || !password) {
    response.status(400).send("Your email or password were missing!");
  } else if(checkUser(email)) {
    response.status(400).send("The email address you entered is already registered.");
  } else {
  users[randomString] = {
    id : randomString,
    email : request.body.email,
    password : request.body.password
  }
  response.cookie('user_id', randomString);
  response.redirect("/urls");
}});


app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}`);
});
